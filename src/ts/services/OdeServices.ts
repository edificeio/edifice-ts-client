import { CacheService } from "../cache/Service";
import { ConfService } from "../configure/Service";
import { DirectoryService } from "../directory/Service";
import { HttpService } from "../transport/Service";
import { ResourceService } from "../resources/ResourceService";
import { RightService } from "../rights/Service";
import { SessionService } from "../session/Service";
import { ShareService } from "../share/Service";
import { WorkspaceService } from "../workspace/Service";
import { IdiomService } from "../idiom/Service";
import { AnalyticsService } from "../analytics/Service";
import { VideoService } from "../video/Service";
import { App, ResourceType } from "../globals";
import { IResourceService, IWebResourceService } from "../resources/interface";
import { EmbedderService } from "../embedder/Service";

export interface IOdeServices {
  analytics(): AnalyticsService;
  cache(): CacheService;
  conf(): ConfService;
  directory(): DirectoryService;
  http(): HttpService;
  idiom(): IdiomService;
  resource(
    application: App,
    resourceType?: ResourceType,
  ): IResourceService & IWebResourceService;
  rights(): RightService;
  session(): SessionService;
  share(): ShareService;
  video(): VideoService;
  workspace(): WorkspaceService;
  embedder(): EmbedderService;
}

export class OdeServices implements IOdeServices {
  private _analytics: AnalyticsService;
  private _cache: CacheService;
  private _conf: ConfService;
  private _directory: DirectoryService;
  private _http: HttpService;
  private _idiom: IdiomService;
  private _rights: RightService;
  private _session: SessionService;
  private _share: ShareService;
  private _video: VideoService;
  private _workspace: WorkspaceService;
  private _embedder: EmbedderService;

  constructor() {
    this._analytics = new AnalyticsService(this);
    this._cache = new CacheService(this);
    this._conf = new ConfService(this);
    this._directory = new DirectoryService(this);
    this._http = new HttpService(this);
    this._idiom = new IdiomService(this);
    this._rights = new RightService(this);
    this._session = new SessionService(this);
    this._share = new ShareService(this);
    this._video = new VideoService(this);
    this._workspace = new WorkspaceService(this);
    this._embedder = new EmbedderService(this);
  }

  analytics() {
    return this._analytics;
  }

  cache() {
    return this._cache;
  }

  conf() {
    return this._conf;
  }

  directory(): DirectoryService {
    return this._directory;
  }

  http() {
    return this._http;
  }

  idiom() {
    return this._idiom;
  }

  resource(
    application: App,
    resourceType?: ResourceType,
  ): IResourceService & IWebResourceService {
    if (!resourceType) {
      return ResourceService.findMainService({ application }, this);
    }
    return ResourceService.findService({ application, resourceType }, this);
  }

  rights() {
    return this._rights;
  }

  session() {
    return this._session;
  }

  share() {
    return this._share;
  }

  video() {
    return this._video;
  }

  workspace() {
    return this._workspace;
  }

  embedder() {
    return this._embedder;
  }
}
