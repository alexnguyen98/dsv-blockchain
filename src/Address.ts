class Address {
  ip: string;
  port: number;

  constructor(ip: string, port: number) {
    this.ip = ip;
    this.port = port;
  }

  toString() {
    return `${this.ip}:${this.port}`;
  }
}

export default Address;
