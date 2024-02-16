import { App, IResource, ResourceType } from "../..";
import {
  CollaborativewallUpdate,
  CreateParameters,
  CreateResult,
  UpdateResult,
} from "../interface";
import { ResourceService } from "../ResourceService";

const APP = "collaborativewall";
const RESOURCE = "collaborativewall";

export class CollaborativewallResourceService extends ResourceService {
  async create(parameters: CreateParameters): Promise<CreateResult> {
    const res = await this.http.post<CreateResult>(`/collaborativewall`, {
      name: parameters.name,
      description: parameters.description,
      background: "/collaborativewall/public/img/default.jpg",
    });

    this.checkHttpResponse(res);

    return res;
  }

  async update(parameters: CollaborativewallUpdate): Promise<UpdateResult> {
    //const fixThumb = await this.getThumbnailPath(parameters.thumbnail);
    const res = await this.http.put<IResource>(
      `/collaborativewall/${parameters.entId}`,
      {
        _id: parameters.entId,
        name: parameters.name,
        description: parameters.description,
        background: "/collaborativewall/public/img/default.jpg",
      },
    );
    this.checkHttpResponse(res);
    return { entId: parameters.entId } as UpdateResult;
  }
  getResourceType(): ResourceType {
    return RESOURCE;
  }
  getApplication(): App | string {
    return APP;
  }
  getFormUrl(folderId?: string): string {
    return folderId
      ? `/collaborativewall?folderid=${folderId}/new`
      : `/collaborativewall/new`;
  }
  getViewUrl(resourceId: string): string {
    return `/collaborativewall/id/${resourceId}`;
  }
  getPrintUrl(resourceId: string, withComment?: boolean): string {
    return `/collaborativewall/print/id/${resourceId}?comments=${
      withComment || true
    }`;
  }
}
ResourceService.register(
  { application: APP, resourceType: RESOURCE },
  (context) => new CollaborativewallResourceService(context),
);
