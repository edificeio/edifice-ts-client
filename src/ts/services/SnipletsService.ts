import { TimelinegeneratorBehaviour } from "../resources/behaviours/TimelinegeneratorBehaviour";
import { App, ERROR_CODE, ResourceType } from "../globals";
import { IOdeServices } from "./OdeServices";
import { ResourceService } from "../resources/ResourceService";
import { AbstractBehaviourService } from "../resources/behaviours/AbstractBehaviourService";
import { WorkspaceBehaviour } from "../resources/behaviours/WorkspaceBehaviour";
import { BlogBehaviour } from "../resources/behaviours/BlogBehaviour";
import { ActualitesBehaviour } from "../resources/behaviours/ActualitesBehaviour";
import { WikiBehaviour } from "../resources/behaviours/WikiBehaviour";
import { PagesBehaviour } from "../resources/behaviours/PagesBehaviour";
import { CommunityBehaviour } from "../resources/behaviours/CommunityBehaviour";
import { MindmapBehaviour } from "../resources/behaviours/MindmapBehaviour";
import { ForumBehaviour } from "../resources/behaviours/ForumBehaviour";
import { HomeworksBehaviour } from "../resources/behaviours/HomeworksBehaviour";
import { ScrapbookBehaviour } from "../resources/behaviours/ScrapbookBehaviour";
import { CollaborativewallBehaviour } from "../resources/behaviours/CollaborativewallBehaviour";
import { ExercizerBehaviour } from "../resources/behaviours/ExercizerBehaviour";
import { FormulaireBehaviour } from "../resources/behaviours/FormulaireBehaviour";
import { MagnetoBehaviour } from "../resources/behaviours/MagnetoBehaviour";
import { PollBehaviour } from "../resources/behaviours/PollBehaviour";

export class SnipletsService {
  static resourceProducingApps: App[] = [];

  private static serviceFor(
    context: IOdeServices,
    application: App,
    resourceType: ResourceType,
  ) {
    let service: AbstractBehaviourService;
    switch (resourceType) {
      case "timelinegenerator":
        service = new TimelinegeneratorBehaviour(context);
        break;
      case "workspace":
        service = new WorkspaceBehaviour(context);
        break;
      case "blog":
        service = new BlogBehaviour(context);
        break;
      case "actualites":
        service = new ActualitesBehaviour(context);
        break;
      case "wiki":
        service = new WikiBehaviour(context);
        break;
      case "pages":
        service = new PagesBehaviour(context);
        break;
      case "poll":
        service = new PollBehaviour(context);
        break;
      case "community":
        service = new CommunityBehaviour(context);
        break;
      case "mindmap":
        service = new MindmapBehaviour(context);
        break;
      case "forum":
        service = new ForumBehaviour(context);
        break;
      case "homeworks":
        service = new HomeworksBehaviour(context);
        break;
      case "scrapbook":
        service = new ScrapbookBehaviour(context);
        break;
      case "collaborativewall":
        service = new CollaborativewallBehaviour(context);
        break;
      case "exercizer":
        service = new ExercizerBehaviour(context);
        break;
      case "formulaire":
        service = new FormulaireBehaviour(context);
        break;
      case "magneto":
        service = new MagnetoBehaviour(context);
        break;
      default:
        throw ERROR_CODE.NOT_SUPPORTED;
    }
    service.APP = application;
    return service;
  }

  static async initialize(
    context: IOdeServices,
    currentApp: App,
  ): Promise<App[]> {
    const http = context.http();
    return new Promise<App[]>(async (resolve, reject) => {
      if (!this.resourceProducingApps.length) {
        // Default to current app and workspace
        this.resourceProducingApps = [currentApp, "workspace"];

        // Dynamic load prefixes of resource-producing apps
        try {
          const [appList, me] = await Promise.all([
            http.get<App[]>("/resources-applications"),
            context.session().getUser(),
          ]);
          if (me && me.apps && appList?.length) {
            // Sanitize list agains authorized apps for this user
            this.resourceProducingApps = appList.filter((appPrefix) => {
              return (
                -1 <
                me.apps.findIndex((webapp) => {
                  return (
                    webapp.address.indexOf(appPrefix) !== -1 &&
                    webapp.icon.indexOf("/") === -1
                  );
                })
              );
            });
          }
        } catch {
          /* keep default */
        }
      }
      resolve(this.resourceProducingApps);
    });
  }

  static async registerBehaviours(currentApp: App): Promise<void> {
    // Register services
    this.resourceProducingApps.forEach((app) => {
      const key = { application: currentApp, resourceType: app };
      // But not if one is already registered
      if (!ResourceService.isRegistered(key)) {
        ResourceService.register(key, (context: IOdeServices) =>
          this.serviceFor(context, currentApp, app),
        );
      }
    });
    // we wanna return a promise because behaviours may be lazy loaded in a near future
    return Promise.resolve();
  }
}
