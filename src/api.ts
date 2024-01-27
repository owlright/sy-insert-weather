import * as cheerio from "cheerio";
import axios from "axios";
const WEATHER_SITE = "https://weather.cma.cn/";
const WEATHER_SITE_API = WEATHER_SITE + "api/";

const parseWeatherHtml = (weatherHtml: string): string => {
    const weekDayIndex = 0;
    const weatherIndex = 2;
    const temperatureIndex = 5;
    const $ = cheerio.load(weatherHtml);
    const dayList = $("div#dayList").children(".pull-left.day");
    const storeStr = [];
    for (let i = 0; i < dayList.length; i++) {
        const dayItems = $(dayList[i]).children("div");
        const weekDay = $(dayItems[weekDayIndex]).text().trim().replace(/\s/g, "");
        const weather = $(dayItems[weatherIndex]).text().trim();
        const temperature = $(dayItems[temperatureIndex]);
        const zhDay = weekDay.substring(0, 3);
        const date = weekDay.substring(3);
        const highTemperature = $(".high", temperature).text().trim();
        const lowTemperature = $(".low", temperature).text().trim();
        console.log(`${zhDay}, ${date}, ${weather}, ${highTemperature}, ${lowTemperature}`);
        storeStr.push(`${zhDay}, ${date}, ${weather}, ${highTemperature}, ${lowTemperature}`);
    }
    return storeStr.join("\n");
}

export const getCities = async (pCode: string): Promise<string> => {
    const response = await axios.get(WEATHER_SITE_API + "dict/province/" + pCode);
    const ret = response.data;
    if (ret["msg"] !== "success") {
        throw Error("获取城市信息失败");
    } else {
        return ret["data"];
    }
}

export const getProvinces = async (): Promise<string> => {
    const response = await axios.get(WEATHER_SITE_API + "dict/province/");
    const ret = response.data;
    if (ret["msg"] !== "success") {
        throw Error("获取省份信息失败");
    } else {
        return ret["data"];
    }
}

const get7daysWeather = async (city: string): Promise<Object[]> => {
    return axios.get(WEATHER_SITE_API + "weather/" + city).then((response) => {
        return response.data.data["daily"];
    });
}

export const getTodayWeather = async (city: string): Promise<string> => {
    const sevenDays = await get7daysWeather(city);
    if (sevenDays.length === 0) {
        throw Error("获取天气信息失败");
    }
    //@ts-ignore
    return sevenDays[0].dayText;
}

/**
 * TODO: what does id mean?
 * @param cityCode
 * @param id
 * @returns
 */
export const getAllCityMap = (cityCode:string, id: string): Promise<string> => {
    return axios.get(WEATHER_SITE_API + "map/weather/" + id).then((response) => {const cityData = response.data["city"];
    for (const weather of cityData) {
        if (weather[0] == cityCode) {
            return weather;
        }
    }
    return "";
});
}

