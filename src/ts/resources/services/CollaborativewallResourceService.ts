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
  "/img/cloud.png",
  "/img/default.jpg",
  "/img/paper.jpg",
  "/img/wood.jpg",
];

const backgroundColors = [
  "115deg, #E5F5FF 0.32%, #46AFE6 100%",
  "116.76deg, #FFECEE 0.32%, #FF3A55 99.93%",
  "116.76deg, #F6ECF9 0.32%, #A348C0 99.93%",
  "116.76deg, #FFEFE3 0.32%, #FF8D2E 99.93%",
];

const randomNumber = Math.trunc(Math.random() * (4 - 0) + 0);

export class CollaborativewallResourceService extends ResourceService {
  async create(parameters: CreateParameters): Promise<CreateResult> {
    const thumbnail = await this.getThumbnailPath(parameters.thumbnail);
    const res = await this.http.post<CreateResult>(`/collaborativewall`, {
      name: parameters.name,
      description: parameters.description,
      background: {
        path: backgroundImages[randomNumber],
        color: backgroundColors[randomNumber],
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
  getPrintUrl(resourceId: string): string {
    return `/collaborativewall/print/id/${resourceId}`;
  }
}
ResourceService.register(
  { application: APP, resourceType: RESOURCE },
  (context) => new CollaborativewallResourceService(context),
);
