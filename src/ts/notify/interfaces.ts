import { ITheme, IThemeOverrides } from "../configure/interfaces";
import { IUserInfo } from "../session/interfaces";
import { notify } from "./Framework";
import { IHttpParams, IHttpResponse } from "../transport/interfaces";

//-------------------------------------
export abstract class NotifyFrameworkFactory {
  static instance(): INotifyFramework {
    return notify;
  }
}

//-------------------------------------
export interface INotifyFramework {
  /**
   * Notify that a process is done and data ready or rejected.
   * Utility method : wrap your own Promise.
   * Or use one of the predefined promises.
   */
  promisify<T>(): IPromisified<T>;

  /**
   * Notify that a process is done and data ready or rejected.
   * Promise / resolve / reject of current user's language.
   */
  onLangReady(): IPromisified<string>;

  /**
   * Notify that a process is done and data ready or rejected.
   * Promise / resolve / reject of current user's session.
   */
  onSessionReady(): IPromisified<IUserInfo>;

  /**
   * Notify that a process is done and data ready or rejected.
   * This data is not intended to change after being resolved.
   * Promise / resolve / reject of asynchronous skin.
   */
  onSkinReady(): IPromisified<ITheme>;

  /**
   * Notify that a process is done and data ready or rejected.
   * This data is not intended to change after being resolved.
   * Promise / resolve / reject of asynchronous skin overrides.
   */
  onOverridesReady(): IPromisified<IThemeOverrides>;

  /**
   * Notify that an event occured.
   * By definition, an event can occur multiple times (otherwise it is a one-time "process", see above) and be watched by many targets.
   * => We model it as a subject with many potential subscribers.
   */
  events(): ISubject;
}

//-------------------------------------
export interface IPromisified<T> {
  readonly promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

//-------------------------------------
export const LAYER_NAME = {
  WIDGETS: "widgets",
  EXPLORER: "explorer",
  TRANSPORT: "transport",
} as const;
export type LayerName = (typeof LAYER_NAME)[keyof typeof LAYER_NAME];

//-------------------------------------
export const EVENT_NAME = {
  USERPREF_CHANGED: "userprefChanged",
  SEARCH_RESULTED: "searchResulted",
  ERROR_OCCURED: "error",
} as const;
export type EventName = (typeof EVENT_NAME)[keyof typeof EVENT_NAME];

/** Generic typing of an event message. */
//-------------------------------------
export interface ISubjectMessage {
  name: EventName;
  data?: any;
}

/** Typing of error messages on the TRANSPORT layer. */
//-------------------------------------
export interface IHttpErrorEvent extends ISubjectMessage {
  name: typeof EVENT_NAME.ERROR_OCCURED;
  data: {
    params?: IHttpParams;
    response: IHttpResponse;
    payload?: any;
  };
}

/** A subscription to receive ISubjectMessage */
//-------------------------------------
export interface ISubscription {
  /** Close the subscription */
  revoke: () => void;
}

export type TransportLayer = typeof LAYER_NAME.TRANSPORT;

/** + Generic typing of a subject. */
//-------------------------------------
export interface ISubject {
  subscribe(
    layer: Omit<LayerName, TransportLayer>,
    handler: <T extends ISubjectMessage>(message: T) => void,
  ): ISubscription;
  publish(
    layer: Omit<LayerName, TransportLayer>,
    message: ISubjectMessage,
  ): void;
}

/** + Overloaded typing of a subject, dedicated to transport errors. */
//-------------------------------------
export declare interface ISubject {
  publish(layer: TransportLayer, message: IHttpErrorEvent): void;
  subscribe(
    layer: TransportLayer,
    handler: (message: IHttpErrorEvent) => void,
  ): ISubscription;
}
