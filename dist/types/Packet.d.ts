export declare enum PACKET_TYPES {
    GETADDR = "GETADDR",
    ADDR = "ADDR",
    PING = "PING",
    PONG = "PONG",
    INV = "INV",
    GETDATA = "GETDATA",
    TX = "TX",
    BLOCK = "BLOCK",
    GETBLOCKS = "GETBLOCKS",
    RESYNC = "RESYNC"
}
export declare type Packet = {
    type: PACKET_TYPES;
    payload?: any;
};
