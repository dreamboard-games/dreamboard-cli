plugins {
    id("dreamboard.kotlin-jvm")
}

group = "com.dreamboard"
version = "0.0.1"

dependencies {
    testImplementation(kotlin("test"))
}

// Path to ui-sdk source files (sibling package)
val uiSdkSrcDir = file("../ui-sdk/src")
// Path to ui-sdk package.json for version extraction
val uiSdkPackageJson = file("../ui-sdk/package.json")
// Path to public API client generated file
val apiClientTypesFile = file("../api-client/src/types.gen.ts")
// Staging directory for ui-sdk sources (before processResources copies to final location)
val uiSdkStagingDir = layout.buildDirectory.dir("generated/ui-sdk-src").get().asFile
// Staging directory for generated type definition files
val generatedTypesDir = layout.buildDirectory.dir("generated/types").get().asFile

/**
 * Task to copy ui-sdk source files directly from the sibling package.
 * This replaces the Node.js copy-sources.js script.
 */
val copyUiSdkSources by tasks.registering(Copy::class) {
    description = "Copies ui-sdk source files for JVM classpath access"
    group = "build"
    
    from(uiSdkSrcDir) {
        include("**/*.ts")
        include("**/*.tsx")
    }
    
    into(uiSdkStagingDir)
    
    // Only run if ui-sdk sources exist
    onlyIf { uiSdkSrcDir.exists() }
}

/**
 * Task to copy the api-client type file for type extraction at runtime.
 */
val copyApiClientTypes by tasks.registering(Copy::class) {
    description = "Copies api-client types for runtime type extraction"
    group = "build"
    
    dependsOn(copyUiSdkSources)
    
    from(apiClientTypesFile)
    into(uiSdkStagingDir)
    rename { "types.gen.ts" }
    
    // Only run if api-client types exist
    onlyIf { apiClientTypesFile.exists() }
}

/**
 * Task to generate files.json manifest listing all ui-sdk source files.
 * This allows Kotlin to discover available files at runtime.
 */
val generateUiSdkManifest by tasks.registering {
    description = "Generates files.json manifest for ui-sdk sources"
    group = "build"
    
    dependsOn(copyUiSdkSources)
    
    val manifestFile = file("$uiSdkStagingDir/files.json")
    outputs.file(manifestFile)
    inputs.dir(uiSdkSrcDir)
    
    doLast {
        if (!uiSdkSrcDir.exists()) {
            logger.warn("ui-sdk source directory not found: $uiSdkSrcDir")
            return@doLast
        }
        
        // Collect all .ts and .tsx files relative to src/
        val files = fileTree(uiSdkSrcDir) {
            include("**/*.ts")
            include("**/*.tsx")
        }.files.map { it.relativeTo(uiSdkSrcDir).path.replace("\\", "/") }
            .sorted()
        
        // Write as JSON array
        val json = files.joinToString(",\n  ", "[\n  ", "\n]") { "\"$it\"" }
        manifestFile.parentFile.mkdirs()
        manifestFile.writeText(json)
        
        logger.lifecycle("Generated ui-sdk manifest with ${files.size} files")
    }
}

/**
 * Task to extract version from ui-sdk package.json and create version.json.
 * This allows Kotlin to know the SDK version at runtime for tracking.
 */
val generateUiSdkVersion by tasks.registering {
    description = "Extracts ui-sdk version from package.json"
    group = "build"
    
    val versionFile = file("$uiSdkStagingDir/version.json")
    outputs.file(versionFile)
    inputs.file(uiSdkPackageJson)
    
    doLast {
        if (!uiSdkPackageJson.exists()) {
            logger.warn("ui-sdk package.json not found: $uiSdkPackageJson")
            return@doLast
        }
        
        // Parse package.json to extract version
        val packageJsonContent = uiSdkPackageJson.readText()
        val versionRegex = """"version"\s*:\s*"([^"]+)"""".toRegex()
        val matchResult = versionRegex.find(packageJsonContent)
        val version = matchResult?.groupValues?.get(1) ?: "unknown"
        
        // Write version.json
        val json = """{"version": "$version"}"""
        versionFile.parentFile.mkdirs()
        versionFile.writeText(json)
        
        logger.lifecycle("Generated ui-sdk version.json with version: $version")
    }
}

/**
 * Task to generate game-message.d.ts from the GameMessage types in api-client.
 *
 * Extracts the GameMessage discriminated union and all its constituent message types
 * from types.gen.ts, strips fields that reference SimpleGameState (game state is
 * accessed via AssertContext.gameState instead), and writes a clean .d.ts suitable
 * for use in game project test scaffolding.
 *
 * Types whose fields are omitted: SimpleGameState, GameAction, ActionDefinition, SeatAssignment.
 * These are either replaced by AssertContext.gameState or are not meaningful in test assertions.
 */
val generateGameMessageTypes by tasks.registering {
    description = "Generates game-message.d.ts from api-client GameMessage definitions"
    group = "build"

    val outputFile = file("$generatedTypesDir/game-message.d.ts")
    inputs.file(apiClientTypesFile).optional()
    outputs.file(outputFile)

    onlyIf { apiClientTypesFile.exists() }

    doLast {
        if (!apiClientTypesFile.exists()) {
            logger.warn("api-client types not found at $apiClientTypesFile, skipping game-message.d.ts generation")
            return@doLast
        }

        val sourceLines = apiClientTypesFile.readText().lines()

        // Message types to extract, in declaration order
        val typeNames = listOf(
            "GameMessageType", "GameMessage",
            "GameStartedMessage", "YourTurnMessage", "ActionExecutedMessage",
            "ActionRejectedMessage", "TurnChangedMessage", "GameEndedMessage",
            "StateUpdateMessage", "StateChangedMessage", "AvailableActionsMessage",
            "ErrorMessage", "LobbyUpdateMessage", "HistoryEntrySummary",
            "HistoryUpdatedMessage", "HistoryRestoredMessage",
        )

        // Field types that are not available in game project scope and must be omitted
        val typesToStrip = setOf("SimpleGameState", "GameAction", "ActionDefinition", "SeatAssignment")

        // Extract one complete type block (including any preceding JSDoc) from sourceLines.
        fun extractTypeBlock(typeName: String): String? {
            val idx = sourceLines.indexOfFirst { line ->
                line.matches(Regex("export type $typeName\\b.*"))
            }
            if (idx == -1) return null

            // Look back past blank lines for a preceding JSDoc block
            var blockStart = idx
            var j = idx - 1
            while (j >= 0 && sourceLines[j].isBlank()) j--
            if (j >= 0 && sourceLines[j].trimStart().startsWith("*/")) {
                while (j >= 0 && !sourceLines[j].trimStart().startsWith("/**")) j--
                if (j >= 0 && sourceLines[j].trimStart().startsWith("/**")) blockStart = j
            }

            // Single-line type (e.g. GameMessageType): declaration ends with ';' on the same line
            if (sourceLines[idx].trimEnd().endsWith(";")) {
                return sourceLines.subList(blockStart, idx + 1).joinToString("\n")
            }

            // Multi-line type: accumulate lines until open brace/paren depth returns to zero
            var depth = 0
            var endIdx = idx
            for (i in idx until sourceLines.size) {
                depth += sourceLines[i].count { it == '{' || it == '(' } -
                    sourceLines[i].count { it == '}' || it == ')' }
                if (i > idx && depth == 0) {
                    endIdx = i
                    break
                }
            }

            return sourceLines.subList(blockStart, endIdx + 1).joinToString("\n")
        }

        // Remove field lines (and their preceding JSDoc) that reference an unavailable type.
        fun stripFields(block: String): String {
            val lines = block.lines()
            val toRemove = mutableSetOf<Int>()

            for (i in lines.indices) {
                val line = lines[i]
                // A field line: indented 4 spaces, ends with ';', not a comment line
                val isFieldLine = line.startsWith("    ") &&
                    line.trimEnd().endsWith(";") &&
                    !line.trimStart().startsWith("*") &&
                    !line.trimStart().startsWith("/")
                if (isFieldLine && typesToStrip.any { line.contains(it) }) {
                    toRemove.add(i)
                    // Also remove the preceding JSDoc block if present
                    var k = i - 1
                    while (k >= 0 && lines[k].isBlank()) k--
                    if (k >= 0 && lines[k].trimStart().startsWith("*/")) {
                        val closeK = k
                        while (k >= 0 && !lines[k].trimStart().startsWith("/**")) k--
                        if (k >= 0) (k..closeK).forEach { toRemove.add(it) }
                    }
                }
            }

            return lines.filterIndexed { i, _ -> i !in toRemove }.joinToString("\n")
        }

        val output = StringBuilder()
        output.appendLine(
            """
/**
 * Framework-defined SSE event message types.
 * Generated from @dreamboard/api-client — do not edit.
 *
 * Note: Fields referencing SimpleGameState are omitted here; access the current
 * game state via AssertContext.gameState instead.
 */
            """.trimIndent(),
        )

        for (typeName in typeNames) {
            val block = extractTypeBlock(typeName)
            if (block == null) {
                logger.warn("game-message.d.ts: type '$typeName' not found in types.gen.ts")
                continue
            }
            output.appendLine(stripFields(block))
        }

        outputFile.parentFile.mkdirs()
        outputFile.writeText(output.toString().trimEnd() + "\n")
        logger.lifecycle("Generated game-message.d.ts with ${typeNames.size} types from types.gen.ts")
    }
}

// Configure processResources to only include specific folders
tasks.named<ProcessResources>("processResources") {
    dependsOn(copyUiSdkSources, copyApiClientTypes, generateUiSdkManifest, generateUiSdkVersion, generateGameMessageTypes)
    
    // Exclude source folders, only include built artifacts and types
    exclude("**/example-plugin/**")
    exclude("**/template/**")
    // Exclude the old ui-sdk-src from src/main/resources (we now copy directly from ui-sdk package)
    exclude("**/ui-sdk-src/**")

    // Include only the built dist from example-plugin
    from("src/main/resources/example-plugin/dist") {
        into("example-plugin/dist")
    }
    // Include template source
    from("src/main/resources/template/src") {
        into("template/src")
    }
    // Include type definitions (generated by ui-sdk build:types)
    from("src/main/resources/types") {
        into("types")
    }
    // Include generated type definitions (e.g. game-message.d.ts derived from api-client)
    from(generatedTypesDir) {
        into("types")
    }
    // Include ui-sdk source files from staging directory
    from(uiSdkStagingDir) {
        into("ui-sdk-src")
    }
    
    // Handle duplicates by preferring the last one (types are explicitly included above)
    duplicatesStrategy = DuplicatesStrategy.INCLUDE
}
