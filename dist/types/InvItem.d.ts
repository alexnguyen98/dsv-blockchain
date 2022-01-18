export declare enum INV_TYPES {
    TX = "TX",
    BLOCK = "BLOCK"
}
export declare type InvItem = {
    type: INV_TYPES;
    hash: string;
};
