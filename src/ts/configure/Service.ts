import { configure } from "./Framework";
import { IGetConf, IOdeTheme, IThemeConf } from "./interfaces";
import { App } from "../globals";
import { IWebApp } from "../session/interfaces";
import { IOdeServices } from "../services/OdeServices";

export class ConfService {
  constructor(private context: IOdeServices) {}

  private get http() {
    return this.context.http();
  }

  private get cdnDomain(): string {
    return configure.Platform.cdnDomain;
  }

  async getConf(app: App): Promise<IGetConf> {
    const [conf, applications] = await Promise.all([
      this.getThemeConf(),
      this.getApplicationsList(),
    ]);

    const [theme, currentApp] = await Promise.all([
      this.getTheme({ conf }),
      this.getWebAppConf({ app, applications }),
    ]);

    return {
      applications,
      conf,
      currentApp,
      theme,
    };
  }

  async getPublicConf(app: App): Promise<any> {
    const publicConfResponse = await this.http.get<any>(`/${app}/conf/public`, {
      queryParams: { _: configure.Platform.deploymentTag },
    });
    return publicConfResponse;
  }

  getCdnUrl(): string | undefined {
    //TODO to implement
    console.warn("[getCdnUrl] Not implemented yet");
    return undefined;
  }

  async savePreference<T>(key: string, value: T) {
    this.http.putJson(`/userbook/preference/${key}`, value);
  }

  async getPreference<T>(key: string): Promise<T> {
    const res = await this.http.get<{ preference: string }>(
      `/userbook/preference/${key}`,
    );
    return JSON.parse(res.preference) as T;
  }

  private async getThemeConf(version?: string): Promise<IThemeConf> {
    const res = await this.http.getScript<IThemeConf>(
      "/assets/theme-conf.js",
      { queryParams: { v: version } },
      "exports.conf",
    );
    return res;
  }

  private async getApplicationsList(): Promise<IWebApp[]> {
    const response = await this.http.get<{ apps: Array<IWebApp> }>(
      `/applications-list`,
    );
    return response.apps;
  }

  private async getWebAppConf({
    app,
    applications,
  }: {
    app: App;
    applications: IWebApp[];
  }): Promise<IWebApp | undefined> {
    const find = applications.find((item) => {
      if (item?.prefix) {
        return item?.prefix.replace("/", "") === app;
      }
    });
    return find;
  }

  private async getTheme({
    version,
    conf,
  }: {
    version?: string;
    conf: any;
  }): Promise<IOdeTheme> {
    const theme = await this.http.get<IOdeTheme>("/theme", {
      queryParams: { _: version },
    });
    const skin = theme.themeName;
    const skins = conf?.overriding.find(
      (item: { child: any }) => item.child === skin,
    ).skins;
    const bootstrapPath = "/assets/themes/edifice-bootstrap";
    const bootstrapVersion = conf?.overriding
      .find((item: { child: any }) => item.child === skin)
      .bootstrapVersion.split("-")
      .slice(-1)[0];

    const is1d =
      conf?.overriding.find((item: { child: any }) => item.child === skin)
        .parent === "panda";

    return {
      basePath: `${this.cdnDomain}${theme.skin}../../`,
      bootstrapPath,
      bootstrapVersion,
      is1d,
      logoutCallback: theme.logoutCallback,
      skin: theme.skin.split("/assets/themes/")[1].split("/")[0],
      skinName: theme.skinName,
      skins,
      themeName: theme.themeName,
      themeUrl: theme.skin,
    };
  }
}
