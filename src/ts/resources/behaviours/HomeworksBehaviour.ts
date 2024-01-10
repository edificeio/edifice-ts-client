import { IResource } from "../interface";
import { AbstractBehaviourService } from "./AbstractBehaviourService";

type NotebookData = {
  trashed: number;
  _id: number;
  title: string;
  thumbnail: string;
  icon?: string; //FIXME icon field, really ? Or thumbnail or both ?
  selected: boolean;
  shared: boolean;
  owner: {
    userId: string;
    displayName: string;
  };
  //  repeats: Repeat[];
  //  rights: Rights<Notebook>;
  data?: /*Day*/ [];
  modified: { $date: number };
};

export class HomeworksBehaviour extends AbstractBehaviourService {
  APP = "homeworks";
  RESOURCE = "homeworks";

  async loadResources() {
    return (await this.httpGet<NotebookData[]>("/homeworks/list"))
      .filter((homework) => homework.data && homework.trashed === 0)
      .map((homework) => {
        return this.dataToResource({
          title: homework.title,
          ownerName: homework.owner.displayName,
          owner: homework.owner.userId,
          icon: homework.icon || "/img/illustrations/homeworks.svg",
          path: "/homeworks#/view-homeworks/" + homework._id,
          _id: "" + homework._id,
          shared: typeof homework.shared !== "undefined",
          modified: homework.modified,
        });
      });
  }
}
