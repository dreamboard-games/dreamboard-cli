import type {
  BoardEdgeRef,
  BoardVertexRef,
  GameTopologyManifest,
} from "@dreamboard/api-client/types.gen";

type ArrayItem<T> = T extends readonly (infer Item)[] ? Item : never;
type EntryId<T> = T extends { id: infer Id extends string } ? Id : never;
type IdsOf<T> = EntryId<ArrayItem<NonNullable<T>>>;

type CardSetId<Manifest extends GameTopologyManifest> = IdsOf<
  Manifest["cardSets"]
>;
type ZoneId<Manifest extends GameTopologyManifest> = IdsOf<Manifest["zones"]>;
type BoardId<Manifest extends GameTopologyManifest> = IdsOf<
  Manifest["boards"]
>;
type PieceTypeId<Manifest extends GameTopologyManifest> = IdsOf<
  Manifest["pieceTypes"]
>;
type DieTypeId<Manifest extends GameTopologyManifest> = IdsOf<
  Manifest["dieTypes"]
>;
type SetupOptionId<Manifest extends GameTopologyManifest> = IdsOf<
  Manifest["setupOptions"]
>;

type BoardLikeOf<Manifest extends GameTopologyManifest> =
  | ArrayItem<NonNullable<Manifest["boards"]>>
  | ArrayItem<NonNullable<Manifest["boardTemplates"]>>;

type SpaceIdOf<BoardLike> = IdsOf<
  BoardLike extends { spaces?: infer Spaces } ? Spaces : never
>;
type ContainerIdOf<BoardLike> = IdsOf<
  BoardLike extends { containers?: infer Containers } ? Containers : never
>;

type AnySpaceId<Manifest extends GameTopologyManifest> = SpaceIdOf<
  BoardLikeOf<Manifest>
>;
type AnyContainerId<Manifest extends GameTopologyManifest> = ContainerIdOf<
  BoardLikeOf<Manifest>
>;

type BuildTuple<
  Length extends number,
  Accumulator extends unknown[] = [],
> = Accumulator["length"] extends Length
  ? Accumulator
  : BuildTuple<Length, [...Accumulator, unknown]>;

type EnumerateInternal<
  Length extends number,
  Accumulator extends number[] = [],
> = Accumulator["length"] extends Length
  ? Accumulator[number]
  : EnumerateInternal<Length, [...Accumulator, Accumulator["length"]]>;

type AddOne<Count extends number> =
  [...BuildTuple<Count>, unknown]["length"] & number;
type OneTo<Count extends number> = Exclude<EnumerateInternal<AddOne<Count>>, 0>;
type PlayerId<Manifest extends GameTopologyManifest> =
  Manifest["players"]["maxPlayers"] extends infer MaxPlayers extends number
    ? `player-${OneTo<MaxPlayers>}`
    : `player-${number}`;

type SetupOptionChoiceId<Option> = IdsOf<
  Option extends { choices?: infer Choices } ? Choices : never
>;
type SetupOptionOf<Manifest extends GameTopologyManifest> = ArrayItem<
  NonNullable<Manifest["setupOptions"]>
>;
type SetupOptionChoiceIdFor<
  Manifest extends GameTopologyManifest,
  OptionId extends SetupOptionId<Manifest>,
> = SetupOptionChoiceId<Extract<SetupOptionOf<Manifest>, { id: OptionId }>>;

type TypedComponentHomeSpec<Manifest extends GameTopologyManifest> =
  | { type: "detached" }
  | {
      type: "zone";
      zoneId: ZoneId<Manifest>;
    }
  | {
      type: "space";
      boardId: BoardId<Manifest>;
      spaceId: AnySpaceId<Manifest>;
    }
  | {
      type: "container";
      boardId: BoardId<Manifest>;
      containerId: AnyContainerId<Manifest>;
    }
  | {
      type: "edge";
      boardId: BoardId<Manifest>;
      ref: BoardEdgeRef;
    }
  | {
      type: "vertex";
      boardId: BoardId<Manifest>;
      ref: BoardVertexRef;
    }
  | {
      type: "slot";
      hostComponentId: string;
      slotId: string;
    };

type TypedHome<T, Manifest extends GameTopologyManifest> = T extends {
  home?: unknown;
}
  ? Omit<T, "home"> & {
      home?: TypedComponentHomeSpec<Manifest>;
    }
  : T;

type TypedCardSet<
  CardSet,
  Manifest extends GameTopologyManifest,
> = CardSet extends {
  type: "manual";
  cards: infer Cards extends readonly unknown[];
}
  ? Omit<CardSet, "cards"> & {
      cards: ReadonlyArray<TypedHome<ArrayItem<Cards>, Manifest>>;
    }
  : CardSet;

type TypedZone<Zone, Manifest extends GameTopologyManifest> = Zone extends object
  ? Omit<Zone, "allowedCardSetIds"> & {
      allowedCardSetIds?: readonly CardSetId<Manifest>[];
    }
  : Zone;

type TypedPieceSeed<
  Seed,
  Manifest extends GameTopologyManifest,
> = Seed extends object
  ? Omit<Seed, "typeId" | "ownerId" | "home"> & {
      typeId: PieceTypeId<Manifest>;
      ownerId?: PlayerId<Manifest>;
      home?: TypedComponentHomeSpec<Manifest>;
    }
  : Seed;

type TypedDieSeed<
  Seed,
  Manifest extends GameTopologyManifest,
> = Seed extends object
  ? Omit<Seed, "typeId" | "ownerId" | "home"> & {
      typeId: DieTypeId<Manifest>;
      ownerId?: PlayerId<Manifest>;
      home?: TypedComponentHomeSpec<Manifest>;
    }
  : Seed;

type TypedSetupOptionValues<Manifest extends GameTopologyManifest> = Partial<{
  [OptionId in SetupOptionId<Manifest>]: SetupOptionChoiceIdFor<
    Manifest,
    OptionId
  >;
}>;

type TypedSetupProfile<
  Profile,
  Manifest extends GameTopologyManifest,
> = Profile extends object
  ? Omit<Profile, "optionValues"> & {
      optionValues?: TypedSetupOptionValues<Manifest>;
    }
  : Profile;

export type TypedTopologyManifest<Manifest extends GameTopologyManifest> = Omit<
  Manifest,
  "cardSets" | "zones" | "pieceSeeds" | "dieSeeds" | "setupProfiles"
> & {
  cardSets: ReadonlyArray<
    TypedCardSet<ArrayItem<Manifest["cardSets"]>, Manifest>
  >;
  zones?: Manifest["zones"] extends readonly unknown[]
    ? ReadonlyArray<TypedZone<ArrayItem<Manifest["zones"]>, Manifest>>
    : Manifest["zones"];
  pieceSeeds?: Manifest["pieceSeeds"] extends readonly unknown[]
    ? ReadonlyArray<TypedPieceSeed<ArrayItem<Manifest["pieceSeeds"]>, Manifest>>
    : Manifest["pieceSeeds"];
  dieSeeds?: Manifest["dieSeeds"] extends readonly unknown[]
    ? ReadonlyArray<TypedDieSeed<ArrayItem<Manifest["dieSeeds"]>, Manifest>>
    : Manifest["dieSeeds"];
  setupProfiles?: Manifest["setupProfiles"] extends readonly unknown[]
    ? ReadonlyArray<
        TypedSetupProfile<ArrayItem<Manifest["setupProfiles"]>, Manifest>
      >
    : Manifest["setupProfiles"];
};

export function defineTopologyManifest<
  const Manifest extends GameTopologyManifest,
>(manifest: Manifest & TypedTopologyManifest<Manifest>): Manifest {
  return manifest;
}
