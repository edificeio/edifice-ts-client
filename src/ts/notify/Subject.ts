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

  private getChannel(layer: string): BroadcastChannel {
    const name = "Subject:" + layer;
    let channel = this.channels.get(name);
    if (!channel) {
      channel = new BroadcastChannel(name);
      this.channels.set(name, channel);
    }
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
