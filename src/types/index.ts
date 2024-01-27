export const isDevelopment = process.env.NODE_ENV === "development";

export const CACHED_CITYS = "cities";
export const STORAGE_SETTINGS = "weather_settings";
export const DOCK_TYPE = "dock_tab";

export interface WeatherCachedCity {
    [key: string]: { province: string, cities: string[] };
}
export type readonlyWeatherCachedCity = Readonly<WeatherCachedCity>;

export interface StrogeSettings {
    [key: string]: string;
}
export type readonlyStrogeSettings = Readonly<StrogeSettings>;

export const dbg = (message: any) => {
    if (isDevelopment) {
        console.log(message);
    }
};

export const assert = (condition: boolean | object, message: string) => {
    if (!condition) {
        throw new Error(message);
    }
};