import { ERROR_CODE, ID, IHttpParams, ResourceType } from "../..";
import { CacheService } from "../../cache/Service";
import { IOdeServices } from "../../services/OdeServices";
import {
  GetContextParameters,
  IResource,
  IResourceService,
  ISearchResults,
} from "../interface";

function notSupported(): any {
  throw ERROR_CODE.NOT_SUPPORTED;
}

export interface LinkerModel {
  _id: ID;
  title: string;
  ownerName: string;
  owner: string;
  icon: string;
  shared: boolean;
  path?: string;
  modified:
    | string
    | {
        $date: number | string;
      };
}
export interface ILinkedResource extends IResource {
  path: string;
}

/**
 * TO BE DEPRECATED. DO NOT USE UNLESS YOU KNOW WHAT YOU ARE DOING.
 * Facade for the old-fashioned way of listing resources => behaviours.loadResources()
 * Any other functionality is unavailable.
 */
export abstract class AbstractBehaviourService implements IResourceService {
  abstract APP: string;
  abstract RESOURCE: ResourceType;
  /** Adapter function to be implemented by subclasses. */
  abstract loadResources(
    parameters?: GetContextParameters,
  ): Promise<IResource[]>;

  //
  // IMPLEMENTATION
  //
  constructor(protected context: IOdeServices) {
    this._cache = new CacheService(this.context);
  }

  async searchContext(
    parameters: GetContextParameters,
  ): Promise<ISearchResults> {
    return this.resourcesToResults(await this.loadResources(parameters));
  }
  getApplication(): string {
    return this.APP;
  }
  getResourceType(): ResourceType {
    return this.RESOURCE;
  }

  //-----------------
  //--- Utilities ---
  //-----------------
  private _cache: CacheService;

  protected httpGet<R>(url: string, params?: IHttpParams | undefined) {
    return this._cache.httpGetJson<R>(url, params);
  }
  /* Utility to map data between linker model and search model. */
  protected dataToResource({
    modified,
    ...resource
  }: LinkerModel): ILinkedResource {
    const modifiedAt =
      typeof modified === "string"
        ? modified
        : modified?.$date
          ? "" + modified.$date
          : "";
    return {
      application: this.RESOURCE,
      name: resource.title,
      creatorId: resource.owner,
      creatorName: resource.ownerName,
      thumbnail: resource.icon,
      assetId: resource._id,
      modifiedAt,
      shared: resource.shared,
      path: resource.path,
    } as ILinkedResource;
  }

  protected resourcesToResults(resources: IResource[]) {
    return {
      folders: [],
      pagination: {
        startIdx: 0,
        maxIdx: resources.length - 1,
        pageSize: resources.length,
      },
      resources,
    };
  }

  //---------------------------------------------
  //--- Every other members are not supported ---
  //---------------------------------------------
  createContext = notSupported;
  create = notSupported;
  update = notSupported;
  getFormUrl = notSupported;
  getViewUrl = notSupported;
  getPrintUrl = notSupported;
  getShareReadUrl = notSupported;
  getSaveShareUrl = notSupported;
  publish = notSupported;
  createFolder = notSupported;
  updateFolder = notSupported;
  moveToFolder = notSupported;
  listSubfolders = notSupported;
  deleteAll = notSupported;
  trashAll = notSupported;
  restoreAll = notSupported;
}
