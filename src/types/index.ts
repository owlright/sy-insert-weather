export const isDevelopment = process.env.NODE_ENV === "development";

export const CACHED_CITYS = "cities";
export const STORAGE_SETTINGS = "weather_settings";
export const DOCK_TYPE = "dock_tab";

export interface StoragedCache {
    [key: string]: string[];
}

export interface StoragedSetting {
    "provinceCode": string;
    "cityCode": string;
}

export type readonlyStrogeSettings = Readonly<StoragedSetting>;

export const dbg = (message: any) => {
    if (isDevelopment) {
        if (typeof message === "object") {
            console.log(`调试信息: ${JSON.stringify(message)}`);
        } else {
            console.log(`调试信息: ${message}`);
        }
    }
};

export const assert = (condition: boolean | object, message: string) => {
    if (!condition) {
        throw new Error(message);
    }
};