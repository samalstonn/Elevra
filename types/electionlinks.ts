import { Election, ElectionLink } from "@prisma/client";

export type ElectionLinkWithElection = ElectionLink & {
  election: Election;
};
