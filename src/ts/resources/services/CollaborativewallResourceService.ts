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

const backgroundImages = [
  "img/cloud.png",
  "img/default.jpg",
  "img/paper.jpg",
  "img/wood.jpg",
  "img/blue-topo.png",
  "img/edifice.png",
  "img/green-hill.png",
  "img/orange-hill.png",
  "img/sport.png",
];

const randomNumber = Math.trunc(Math.random() * (9 - 0) + 0);

export class CollaborativewallResourceService extends ResourceService {
  async create(parameters: CreateParameters): Promise<CreateResult> {
    const thumbnail = await this.getThumbnailPath(parameters.thumbnail);
    const res = await this.http.post<CreateResult>(`/collaborativewall`, {
      name: parameters.name,
      description: parameters.description,
      background: {
        path: backgroundImages[randomNumber],
        color: "115deg, #E5F5FF 0.32%, #46AFE6 100%",
      },
      icon: thumbnail,
    });

    this.checkHttpResponse(res);
    return res;
  }

  async update(parameters: CollaborativewallUpdate): Promise<UpdateResult> {
    const thumbnail = await this.getThumbnailPath(parameters.thumbnail);
    const res = await this.http.put<IResource>(
      `/collaborativewall/${parameters.entId}`,
      {
        _id: parameters.entId,
        name: parameters.name,
        description: parameters.description,
        icon: thumbnail,
      },
    );
    this.checkHttpResponse(res);
    return { thumbnail, entId: parameters.entId } as UpdateResult;
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
