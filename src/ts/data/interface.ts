/** Joker value to send all events. */
export const SEND_ALL = "*";

/** Public properties of the DataService. */
export interface DataServiceProps {
  /** Parameters for web applications. */
  web?: {
    /**
     * If defined, lists events to send to the backend (with "*" meaning all).
     * If undefined, all events will be sent.
     */
    send?: Array<string | typeof SEND_ALL>;
  };
}

/** An event broker for the DataService. */
export interface IEventBroker {
  /** Stops dispatching messages. */
  destroy(): void;
}
