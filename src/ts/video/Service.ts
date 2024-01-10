import { APP } from "../globals";
import { IOdeServices } from "../services/OdeServices";
import {
  VideoEncodeResponse,
  VideoUploadResponse,
  VideoConf,
  VideoPublicConfResponse,
  VideoUploadParams,
} from "./interface";

export class VideoService {
  private static MAX_WEIGHT = 50; // in Mbytes. Applies to uploaded videos.
  private static MAX_DURATION = 3; // in minutes. Applies to recorded videos.

  constructor(private context: IOdeServices) {}

  private get http() {
    return this.context.http();
  }

  private get conf() {
    return this.context.conf();
  }

  private get session() {
    return this.context.session();
  }

  /**
   * Returns the video app public conf (maxWeight, maxDuration and accepted extensions)
   * @returns the Video app public conf
   */
  public async getVideoConf(): Promise<VideoConf> {
    const publicConf: VideoPublicConfResponse = await this.conf.getPublicConf(
      APP.VIDEO,
    );
    return {
      maxWeight: publicConf["max-videosize-mbytes"] || VideoService.MAX_WEIGHT,
      maxDuration:
        publicConf["max-videoduration-minutes"] || VideoService.MAX_DURATION,
      acceptVideoUploadExtensions: publicConf[
        "accept-videoupload-extensions"
      ].map((ext) => ext.toUpperCase()),
    };
  }

  /**
   * Starts the encoding process and check when video is fully processed.
   * @param params cf VideoUploadParams
   * @returns a VideoCheckResponse
   */
  public async upload(params: VideoUploadParams): Promise<VideoUploadResponse> {
    if (!params.data.file) {
      throw new Error("Invalid video file.");
    }

    if (!params.data.filename) {
      throw new Error("Invalid video filename");
    }

    const formData = new FormData();
    formData.append("device", params.data.device || "");
    formData.append(
      "browser",
      `${params.data.browser.name} ${params.data.browser.version}`,
    );
    formData.append("url", params.data.url);
    formData.append("app", params.appCode);
    formData.append("file", params.data.file, params.data.filename);
    formData.append("weight", "" + params.data.file.size);
    formData.append("captation", "" + params.captation);

    let encodeUrl = `/video/encode?captation=${params.captation}`;
    if (params.duration) {
      encodeUrl += `&duration=${params.duration}`;
    }

    // post video to /videdo/encode API
    const encodeResponse = await this.http.post<VideoEncodeResponse>(
      encodeUrl,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    // if encoding request is pending then get /video/status API to get final result
    if (encodeResponse.state == "running") {
      let previous = 0;
      let seconds = 1;
      do {
        // Wait then check status
        const waitDuration = seconds + previous;
        await new Promise((resolve) =>
          setTimeout(resolve, waitDuration * 1000),
        );
        previous = seconds;
        seconds = Math.min(8, waitDuration); // Fibonacci limited to 8
        const checkResponse = await this.http.get<VideoUploadResponse>(
          `/video/status/${encodeResponse.processid}`,
        );
        if (checkResponse.state == "succeed") {
          return checkResponse;
        }
        if (checkResponse.state == "error") {
          break;
        }
      } while (true);
    }
    throw new Error("Video cannot be uploaded.");
  }

  /**
   * Generate Save Event
   * @param appCode app code (example: "blog")
   * @param elapsedTime encoding elapsed time
   * @param browser browser name and version
   * @param deviceType type of device
   * @param saved uploaded request information
   * @returns Promise<void>
   */
  public async generateSaveEvent(
    appCode: string,
    elapsedTime: number,
    browser: { name: string | undefined; version: string | undefined },
    deviceType: string | undefined,
    saved: VideoUploadResponse,
  ): Promise<void> {
    const user = await this.session.getUser();
    const userProfile = await this.session.getUserProfile();

    return this.http.postJson("/video/event/save", {
      videoId: saved.videoworkspaceid,
      userId: user?.userId,
      userProfile: userProfile[0],
      device: deviceType,
      browser: `${browser.name} ${browser.version}`,
      structure: user?.structureNames[0],
      level: user?.level,
      duration: Math.round(elapsedTime),
      weight: saved.videosize,
      captation: true,
      url: window.location.hostname,
      app: appCode,
    });
  }
}
