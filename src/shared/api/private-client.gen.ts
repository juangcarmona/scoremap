// Generated from the registered partial private API contract. Do not edit.
import type * as Api from "./private-api.gen";
export type Transport = <T>(path: string, init?: RequestInit) => Promise<T>;
export const getApiSongsBySongIdArrangementsByArrangementId = (
  request: Transport,
  path: Api.GetApiSongsBySongIdArrangementsByArrangementIdData["path"],
): Promise<
  Api.GetApiSongsBySongIdArrangementsByArrangementIdResponses[keyof Api.GetApiSongsBySongIdArrangementsByArrangementIdResponses]
> =>
  request(
    `/api/songs/${encodeURIComponent(path["songId"])}/arrangements/${encodeURIComponent(path["arrangementId"])}`,
    { method: "GET" },
  );
export const postApiOfflineLease = (
  request: Transport,
  body: Api.PostApiOfflineLeaseData["body"],
): Promise<
  Api.PostApiOfflineLeaseResponses[keyof Api.PostApiOfflineLeaseResponses]
> =>
  request(`/api/offline-lease`, { method: "POST", body: JSON.stringify(body) });
export const getApiDeviceConfigurations = (
  request: Transport,
): Promise<
  Api.GetApiDeviceConfigurationsResponses[keyof Api.GetApiDeviceConfigurationsResponses]
> => request(`/api/device-configurations`, { method: "GET" });
export const postApiDeviceConfigurations = (
  request: Transport,
  body: Api.PostApiDeviceConfigurationsData["body"],
): Promise<
  Api.PostApiDeviceConfigurationsResponses[keyof Api.PostApiDeviceConfigurationsResponses]
> =>
  request(`/api/device-configurations`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const getApiVoicingPresets = (
  request: Transport,
): Promise<
  Api.GetApiVoicingPresetsResponses[keyof Api.GetApiVoicingPresetsResponses]
> => request(`/api/voicing-presets`, { method: "GET" });
export const postApiVoicingPresets = (
  request: Transport,
  body: Api.PostApiVoicingPresetsData["body"],
): Promise<
  Api.PostApiVoicingPresetsResponses[keyof Api.PostApiVoicingPresetsResponses]
> =>
  request(`/api/voicing-presets`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const getApiPreferencesNotation = (
  request: Transport,
): Promise<
  Api.GetApiPreferencesNotationResponses[keyof Api.GetApiPreferencesNotationResponses]
> => request(`/api/preferences/notation`, { method: "GET" });
export const putApiPreferencesNotation = (
  request: Transport,
  body: Api.PutApiPreferencesNotationData["body"],
): Promise<
  Api.PutApiPreferencesNotationResponses[keyof Api.PutApiPreferencesNotationResponses]
> =>
  request(`/api/preferences/notation`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
export const getApiLibrary = (
  request: Transport,
): Promise<Api.GetApiLibraryResponses[keyof Api.GetApiLibraryResponses]> =>
  request(`/api/library`, { method: "GET" });
export const putApiLibrary = (
  request: Transport,
  body: Api.PutApiLibraryData["body"],
): Promise<Api.PutApiLibraryResponses[keyof Api.PutApiLibraryResponses]> =>
  request(`/api/library`, { method: "PUT", body: JSON.stringify(body) });
export const putApiSongsByIdGrants = (
  request: Transport,
  path: Api.PutApiSongsByIdGrantsData["path"],
  body: Api.PutApiSongsByIdGrantsData["body"],
): Promise<
  Api.PutApiSongsByIdGrantsResponses[keyof Api.PutApiSongsByIdGrantsResponses]
> =>
  request(`/api/songs/${encodeURIComponent(path["id"])}/grants`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
export const postApiRecoveryKeys = (
  request: Transport,
): Promise<
  Api.PostApiRecoveryKeysResponses[keyof Api.PostApiRecoveryKeysResponses]
> => request(`/api/recovery-keys`, { method: "POST" });
export const postApiRecoveryKeysByIdUnlock = (
  request: Transport,
  path: Api.PostApiRecoveryKeysByIdUnlockData["path"],
): Promise<
  Api.PostApiRecoveryKeysByIdUnlockResponses[keyof Api.PostApiRecoveryKeysByIdUnlockResponses]
> =>
  request(`/api/recovery-keys/${encodeURIComponent(path["id"])}/unlock`, {
    method: "POST",
  });
export const deleteApiRecoveryKeysById = (
  request: Transport,
  path: Api.DeleteApiRecoveryKeysByIdData["path"],
): Promise<
  Api.DeleteApiRecoveryKeysByIdResponses[keyof Api.DeleteApiRecoveryKeysByIdResponses]
> =>
  request(`/api/recovery-keys/${encodeURIComponent(path["id"])}`, {
    method: "DELETE",
  });
export const postApiPersonalRecoveryKeys = (
  request: Transport,
): Promise<
  Api.PostApiPersonalRecoveryKeysResponses[keyof Api.PostApiPersonalRecoveryKeysResponses]
> => request(`/api/personal-recovery-keys`, { method: "POST" });
export const postApiPersonalRecoveryKeysByIdUnlock = (
  request: Transport,
  path: Api.PostApiPersonalRecoveryKeysByIdUnlockData["path"],
): Promise<
  Api.PostApiPersonalRecoveryKeysByIdUnlockResponses[keyof Api.PostApiPersonalRecoveryKeysByIdUnlockResponses]
> =>
  request(
    `/api/personal-recovery-keys/${encodeURIComponent(path["id"])}/unlock`,
    { method: "POST" },
  );
export const deleteApiPersonalRecoveryKeysById = (
  request: Transport,
  path: Api.DeleteApiPersonalRecoveryKeysByIdData["path"],
): Promise<
  Api.DeleteApiPersonalRecoveryKeysByIdResponses[keyof Api.DeleteApiPersonalRecoveryKeysByIdResponses]
> =>
  request(`/api/personal-recovery-keys/${encodeURIComponent(path["id"])}`, {
    method: "DELETE",
  });
export const getApiTrash = (
  request: Transport,
): Promise<Api.GetApiTrashResponses[keyof Api.GetApiTrashResponses]> =>
  request(`/api/trash`, { method: "GET" });
export const getApiSongsByIdHistory = (
  request: Transport,
  path: Api.GetApiSongsByIdHistoryData["path"],
): Promise<
  Api.GetApiSongsByIdHistoryResponses[keyof Api.GetApiSongsByIdHistoryResponses]
> =>
  request(`/api/songs/${encodeURIComponent(path["id"])}/history`, {
    method: "GET",
  });
export const postApiSongsByIdRestore = (
  request: Transport,
  path: Api.PostApiSongsByIdRestoreData["path"],
  body: Api.PostApiSongsByIdRestoreData["body"],
): Promise<
  Api.PostApiSongsByIdRestoreResponses[keyof Api.PostApiSongsByIdRestoreResponses]
> =>
  request(`/api/songs/${encodeURIComponent(path["id"])}/restore`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const postApiSongsByIdPurge = (
  request: Transport,
  path: Api.PostApiSongsByIdPurgeData["path"],
  body: Api.PostApiSongsByIdPurgeData["body"],
): Promise<
  Api.PostApiSongsByIdPurgeResponses[keyof Api.PostApiSongsByIdPurgeResponses]
> =>
  request(`/api/songs/${encodeURIComponent(path["id"])}/purge`, {
    method: "POST",
    body: JSON.stringify(body),
  });
