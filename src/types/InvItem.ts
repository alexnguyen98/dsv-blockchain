export enum INV_TYPES {
  TX = 'TX',
  BLOCK = 'BLOCK',
}

export type InvItem = {
  type: INV_TYPES;
  hash: string;
};
