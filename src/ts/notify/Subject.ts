import {
  IHttpErrorEvent,
  ISubject,
  ISubjectMessage,
  ISubjectRevokation,
  ISubjectSubscription,
  LayerName,
} from "./interfaces";

//-------------------------------------
// Event system
//-------------------------------------
export class Subject implements ISubject {
  private channels: Map<string, BroadcastChannel> = new Map<
    string,
    BroadcastChannel
  >();

  private getChannelName(layer: string): string {
    return "Subject:" + layer;
  }

  private getChannel(layer: string): BroadcastChannel {
    const name = this.getChannelName(layer);
    let channel = this.channels.get(name);
    if (!channel) {
      channel = this.newChannel(layer);
      this.channels.set(name, channel);
    }
    return channel;
  }

  public newChannel(layer: string): BroadcastChannel {
    const name = this.getChannelName(layer);
    const channel = new BroadcastChannel(name);
    channel.addEventListener('messageerror', ev => console.log(ev.data) );
    return channel;
}

  publish(layer: LayerName, message: ISubjectMessage | IHttpErrorEvent): void {
    typeof layer === "string" && this.getChannel(layer).postMessage(message);
  }

  subscribe<T extends ISubjectMessage>(
    layer: LayerName,
    handler:ISubjectSubscription<T>,
  ): ISubjectRevokation {
    if (typeof layer === "string") {
      const channel = this.getChannel(layer);
      const subscription = (message: MessageEvent<T>) => handler(message.data);
      channel.addEventListener("message", subscription);
      return () => channel.removeEventListener("message", subscription);
    } else {
      // Fake revokation function
      return () => undefined;
    }
  }
}
