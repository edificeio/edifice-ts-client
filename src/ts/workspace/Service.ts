import { IOdeServices } from "../services/OdeServices";
import { DocumentHelper } from "../utils/DocumentHelper";
import {
  WorkspaceElement,
  WorkspaceSearchFilter,
  WorkspaceVisibility,
} from "./interface";
import { ID } from "../globals";

interface ElementQuery {
  /**
   * Keep only results having this criteria.
   * Defaults to "owner" in backend but must be specified here for clarity.
   */
  filter: WorkspaceSearchFilter;
  /** Restrict results to this element id only (kind of get). */
  id?: ID;
  /** Restrict results to element having this direct parent (folder). */
  parentId?: ID;
  /** Restrict results to elements having this ancestor (folder) at any level. */
  ancestorId?: string;
  /** Restrict results to the 1st folder hierarchy level. */
  onlyRoot?: boolean;
  /** Restrict results to this app. */
  application?: string;
  /** Restrict results to elements containing this text. */
  search?: string;
  /** Extend results to files AND folders. Defaults to false, with file results only. */
  includeall?: boolean;
  /** Max number of results needed. */
  limit?: number;
  /**
   * Skip the first N results.
   * Allows for pagination when used with the `limit` parameter.
   */
  skip?: number;
  /**
   * Restrict results to elements directly shared with the user.
   * => Handle this param through a dedicated method. Do not expose it directly.
   */
  directShared?: boolean;
  /**
   * Truthy when result is a tree ?
   * => Handle this param through a dedicated method. Do not expose it directly.
   */
  hierarchical?: boolean;
}

export class WorkspaceService {
  constructor(private context: IOdeServices) {}
  private get http() {
    return this.context.http();
  }

  private get isAxiosError() {
    const response = this.http.latestResponse;
    return !response || response.status < 200 || response.status >= 300;
  }

  private extractMetadata(file: Blob | File) {
    const tmpName = file.name || "";
    const nameSplit = tmpName.split(".");
    const contentType = file.type || "application/octet-stream";
    const extension =
      nameSplit.length > 1 ? nameSplit[nameSplit.length - 1] : "";
    const metadata = {
      "content-type": contentType,
      filename: tmpName,
      size: file.size,
      extension,
      role: DocumentHelper.role(contentType, false, extension),
    };
    const basename = tmpName.replace("." + metadata.extension, "");
    const fullname = metadata.extension
      ? basename + "." + metadata.extension
      : basename;
    return { basename, fullname, metadata };
  }

  async saveFile(
    file: Blob | File,
    params?: {
      parentId?: string;
      visibility?: WorkspaceVisibility;
      application?: string;
    },
  ) {
    //prepare metadata
    const { fullname, metadata } = this.extractMetadata(file);
    //prepare form data
    const formData = new FormData();
    formData.append("file", file, fullname);
    //add query params
    const args = [];
    if (params?.visibility === "public" || params?.visibility === "protected") {
      args.push(`${params.visibility}=true`);
    }
    if (params?.application) {
      args.push(`application=${params.application}`);
    }
    if (metadata.role === "img") {
      args.push(`quality=1`);
    }
    if (params?.parentId) {
      args.push(`parentId=${params.parentId}`);
    }
    //make query
    const res = await this.http.postFile<WorkspaceElement>(
      `/workspace/document?${args.join("&")}`,
      formData,
    );
    if (this.isAxiosError) {
      throw this.http.latestResponse.statusText;
    }
    return res;
  }

  async updateFile(
    id: string,
    file: Blob | File,
    params?: {
      alt?: string;
      legend?: string;
    },
  ) {
    //prepare metadata
    const { fullname, metadata } = this.extractMetadata(file);
    //prepare form data
    const formData = new FormData();
    formData.append("file", file, fullname);
    //add query params
    const args = [];
    if (metadata.role === "img") {
      args.push(`quality=1`);
    }
    if (params?.alt) {
      args.push(`alt=${params.alt}`);
    }
    if (params?.legend) {
      args.push(`alt=${params.legend}`);
    }
    //make query
    const res = await this.http.putFile<WorkspaceElement>(
      `/workspace/document/${id}?${args.join("&")}`,
      formData,
    );
    if (this.isAxiosError) {
      throw this.http.latestResponse.statusText;
    }
    return res;
  }

  async deleteFile(elements: WorkspaceElement[]) {
    const ids = elements.map((element) => element._id);
    if (ids.length == 0) {
      Promise.resolve(null) as any;
    } else {
      await this.http.deleteJson<WorkspaceElement>(`/workspace/documents`, {
        ids,
      });
      if (this.isAxiosError) {
        throw this.http.latestResponse.statusText;
      }
    }
  }

  private async acceptDocuments(params: ElementQuery) {
    const userInfo = await this.context.session().getUser();
    return (current: WorkspaceElement) => {
      //filter by trasherid
      if (current.deleted && current.trasher) {
        return userInfo?.userId == current.trasher;
      }
      //in case of directShared document => hide doc that are visible inside a folder
      //FIXME no more cache, how to do this ?
      // if(params.directShared && current.eParent){
      //   const isParentVisible = workspaceService._cacheFolders.find(folder => folder._id == current.eParent);
      //   if(isParentVisible){
      //       return false;
      //   }
      // }
      return true;
    };
  }

  private async fetchDocuments(
    params: ElementQuery,
  ): Promise<WorkspaceElement[]> {
    let filesO: WorkspaceElement[] =
      params.filter !== "external" || params.parentId
        ? await this.http.get<WorkspaceElement[]>("/workspace/documents", {
            queryParams: { ...params, _: new Date().getTime() },
          })
        : [];
    const filterFn = await this.acceptDocuments(params);
    return filesO.filter(filterFn);
  }

  async listDocuments(
    filter: WorkspaceSearchFilter,
    parentId?: ID,
  ): Promise<WorkspaceElement[]> {
    return this.fetchDocuments({ filter, parentId, includeall: true });
  }

  async transferDocuments(
    documents: WorkspaceElement[],
    application: string,
    visibility: WorkspaceVisibility = "protected",
  ): Promise<WorkspaceElement[]> {
    const documentsToTransfer: WorkspaceElement[] = [];
    // Copy files from shared/owner to protected/public
    documents.forEach((document: WorkspaceElement) => {
      if (visibility === "public" && !document.public) {
        // Copy file to public
        documentsToTransfer.push(document);
      } else if (!document.public && !document.protected) {
        // Copy file to protected
        documentsToTransfer.push(document);
      }
    });
    if (documentsToTransfer.length > 0) {
      const res = await this.http.post<WorkspaceElement[]>(
        `/workspace/document/transfer?application=${application}&visibility=${visibility}`,
        documents,
      );
      if (this.isAxiosError) {
        throw this.http.latestResponse.statusText;
      }

      // Update the documents array with the new documents
      documentsToTransfer.forEach((document, index) => {
        const documentIndex = documents.findIndex(
          (doc) => doc._id === document._id,
        );
        documents[documentIndex] = res[index];
      });

      // Remove null values from the array (documents that were not copied)
      return documents.filter((document) => !!document);
    }

    return documents;
  }

  getThumbnailUrl(
    doc: WorkspaceElement | string,
    width: number = 0,
    height: number = 0,
  ) {
    if (typeof doc === "string") {
      if (doc.includes("data:image") || doc.includes("thumbnail")) {
        return doc;
      }
      return (
        doc +
        (doc.includes("?") ? "&thumbnail=" : "?thumbnail=") +
        `${width}x${height}`
      );
    } else {
      const thumbnails = doc.thumbnails;
      return thumbnails
        ? `/workspace/${
            doc.public ? "pub/" : ""
          }document/${doc._id}?thumbnail=${Object.keys(thumbnails)[0]}`
        : `/workspace/${doc.public ? "pub/" : ""}document/${doc._id}`;
    }
  }
}
