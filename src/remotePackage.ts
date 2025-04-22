import { SuccessCallback } from "./callbackUtil";
import { CodePushUtil } from "./codePushUtil";
import { LocalPackage } from "./localPackage";
import { NativeAppInfo } from "./nativeAppInfo";
import { DownloadProgress, ILocalPackage, IRemotePackage, Package } from "./package";
import { Sdk } from "./sdk";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { FileUtil } from "./fileUtil";
import { CapacitorHttp as Http } from "@capacitor/core";
import {Encoding} from "@capacitor/filesystem/dist/esm/definitions";

const readBlobAsBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


/**
 * Defines a remote package, which represents an update package available for download.
 */
export class RemotePackage extends Package implements IRemotePackage {

  private isDownloading: boolean = false;

  /**
   * The URL at which the package is available for download.
   */
  public downloadUrl: string;

  /**
   * Downloads the package update from the CodePush service.
   * TODO: implement download progress
   *
   * @param downloadProgress Optional callback invoked during the download process. It is called several times with one DownloadProgress parameter.
   */
  public async download(downloadProgress?: SuccessCallback<DownloadProgress>): Promise<ILocalPackage> {
    CodePushUtil.logMessage("Downloading update");
    if (!this.downloadUrl) {
      CodePushUtil.throwError(new Error("The remote package does not contain a download URL."));
    }

    this.isDownloading = true;

    const file = LocalPackage.DownloadDir + "/" + LocalPackage.PackageUpdateFileName;
    const fullPath = await FileUtil.getUri(Directory.Data, file);

    try {
      // create directory if not exists
      if (!(await FileUtil.directoryExists(Directory.Data, LocalPackage.DownloadDir))) {
        await Filesystem.mkdir({
          path: LocalPackage.DownloadDir,
          directory: Directory.Data,
          recursive: true,
        });
      }

      // delete file if it exists
      if (await FileUtil.fileExists(Directory.Data, file)) {
        await Filesystem.deleteFile({ directory: Directory.Data, path: file });
      }

      //alert('SS before');
      CodePushUtil.logMessage("Before download");

      debugger;

      // const downloadedFile = await Http.get({
      //   url: this.downloadUrl,
      //   method: "GET",
      //   responseType: "blob"
      // });



      const downloadedFile = await fetch(this.downloadUrl);
      const fileAsBlob = await downloadedFile.blob();

      //alert('SS after');

      console.log('AAAAA', downloadedFile);

      CodePushUtil.logMessage("After download");

      //console.log('After download', downloadedFile);

      //@ts-expect-error fdfd
      window.ttreadBlobAsBase64 = readBlobAsBase64;

      //@ts-expect-error fdfd
      window.ttfileAsBlob = fileAsBlob;

      //@ts-expect-error fdfd
      window.ttbase64Data = base64Data;

      //@ts-expect-error fdfd
      window.ttFilesystem = Filesystem;

      //
      // const base64Data = await readBlobAsBase64(fileAsBlob);
      //
      // await Filesystem.writeFile({
      //   path: file,
      //   data: base64Data,
      //   directory: Directory.Documents, // Save to the documents directory
      //   encoding: Encoding.UTF8,
      // });

      CodePushUtil.logMessage("LALALALALAL");

      // Step 3: Convert the Blob to a Base64 string
      // const reader = new FileReader();
      // reader.onloadend = async () => {
      //   const base64Data = reader.result as string;
      //
      //   try {
      //     // Step 4: Write the Base64 data to the File System
      //     const result = await Filesystem.writeFile({
      //       path: file,
      //       data: base64Data,
      //       directory: Directory.Documents, // Save to the documents directory
      //       encoding: Encoding.UTF8,
      //     });
      //
      //     console.log('File saved at', result.uri);
      //   } catch (writeError) {
      //     console.error('Error writing file to filesystem', writeError);
      //   }
      // };
      //
      // CodePushUtil.logMessage("LALALALALAL");
      //
      // // Read the Blob as a Data URL (Base64)
      // reader.readAsDataURL(fileAsBlob); // reader.result will contain Base64 data

    } catch (e) {
      CodePushUtil.throwError(new Error("An error occured while downloading the package. " + (e && e.message) ? e.message : ""));
    } finally {
      this.isDownloading = false;
    }

    const installFailed = await NativeAppInfo.isFailedUpdate(this.packageHash);
    const localPackage = new LocalPackage();
    localPackage.deploymentKey = this.deploymentKey;
    localPackage.description = this.description;
    localPackage.label = this.label;
    localPackage.appVersion = this.appVersion;
    localPackage.isMandatory = this.isMandatory;
    localPackage.packageHash = this.packageHash;
    localPackage.isFirstRun = false;
    localPackage.failedInstall = installFailed;
    localPackage.localPath = fullPath;

    CodePushUtil.logMessage("Package download success: " + JSON.stringify(localPackage));
    Sdk.reportStatusDownload(localPackage, localPackage.deploymentKey);

    return localPackage;
  }

  /**
   * Aborts the current download session, previously started with download().
   */
  public async abortDownload(): Promise<void> {
    // TODO: implement download abort
    return new Promise((resolve) => {
      this.isDownloading = false;
      resolve();
    });
  }
}
