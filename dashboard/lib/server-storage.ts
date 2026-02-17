// Server-side storage that persists across requests
class ServerStorage {
  private static instance: ServerStorage;
  private channels: string[] = [
    "matchupvault",
    "wrestler.trivia",
    "callthemoment",
    "street.slamdown",
    "ragequitguy",
    "celebolution",
    "nearmiss529",
    "arena.fever",
    "slidernightmare"
  ];

  public static getInstance(): ServerStorage {
    if (!ServerStorage.instance) {
      ServerStorage.instance = new ServerStorage();
    }
    return ServerStorage.instance;
  }

  getChannels(): string[] {
    return [...this.channels];
  }

  setChannels(channels: string[]): void {
    this.channels = [...channels];
  }

  addChannels(newChannels: string[]): string[] {
    const uniqueNewChannels = newChannels.filter(
      channel => !this.channels.includes(channel)
    );
    
    if (uniqueNewChannels.length > 0) {
      this.channels = [...this.channels, ...uniqueNewChannels];
    }
    
    return uniqueNewChannels;
  }
}

export const serverStorage = ServerStorage.getInstance();