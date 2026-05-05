// Public entry point for @dreamboard/reducer-contract.
//
// Consumers should import from the specific sub-entry that matches their need:
//   - "@dreamboard/reducer-contract/wire"     — TS types only
//   - "@dreamboard/reducer-contract/zod"      — runtime validators
//   - "@dreamboard/reducer-contract/builders" — typed effect constructors
//   - "@dreamboard/reducer-contract/bundle"   — erased callable bundle boundary
//   - "@dreamboard/reducer-contract/version"  — protocol version constant
//   - "@dreamboard/reducer-contract/fixtures" — canonical wire fixtures for tests
//
// Keep the callable reducer bundle boundary on the dedicated `./bundle`
// sub-entry so consumers converge on one explicit import path.
export * as Wire from "../generated/wire";
export * as Zod from "../generated/zod";
export * as Builders from "../generated/builders";
export { REDUCER_CONTRACT_VERSION } from "../generated/version";
