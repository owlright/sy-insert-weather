import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    openTab,
    adaptHotkey,
    getFrontend,
    getBackend,
    IModel,
    Setting,
    fetchPost,
    Protyle, openWindow, IOperation, IEventBusMap
} from "siyuan";

import axios from 'axios';
import * as cheerio from 'cheerio';
const isDevelopment = process.env.NODE_ENV === "development";
import "./index.scss";


interface WeatherCachedCity {
    [key: string]: {province:string, cities:string[]};
}
type readonlyWeatherCachedCity = Readonly<WeatherCachedCity>;

const WEATHER_SITE_API = "https://weather.cma.cn/api/";
const CACHED_CITYS = "cities";
const STORAGE_SETTINGS = "weather_settings";

const dbg = (message:any) => {
    if (isDevelopment) {
        console.log(message);
    }
}

const assert = (condition:boolean|object, message:string) => {
    if (!condition) {
        throw new Error(message);
    }
}

export default class InsertWeatherPlugin extends Plugin {

    private isMobile: boolean;


    parseWeatherHtml(weatherHtml: string): string {
        const weekDayIndex = 0;
        const weatherIndex = 2;
        const temperatureIndex = 5;
        const $ = cheerio.load(weatherHtml);
        const dayList = $('div#dayList').children('.pull-left.day');
        let storeStr = [];
        for (let i = 0; i < dayList.length; i++) {
            const dayItems = $(dayList[i]).children('div');
            const weekDay = $(dayItems[weekDayIndex]).text().trim().replace(/\s/g, '');
            const weather = $(dayItems[weatherIndex]).text().trim();
            const temperature = $(dayItems[temperatureIndex]);
            const zhDay = weekDay.substring(0, 3);
            const date = weekDay.substring(3);
            const highTemperature = $('.high', temperature).text().trim();
            const lowTemperature = $('.low', temperature).text().trim();
            console.log(`${zhDay}, ${date}, ${weather}, ${highTemperature}, ${lowTemperature}`);
            storeStr.push(`${zhDay}, ${date}, ${weather}, ${highTemperature}, ${lowTemperature}`);
        }
        return storeStr.join('\n');
    }

    onload() {
        this.data[CACHED_CITYS] = null as WeatherCachedCity;

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconWeather" viewBox="0 0 1024 1024">
        <path d="M548.769933 204.8c152.439467 0 277.8112 113.698133 292.590934 259.310933C927.0014 487.082667 989.875 563.950933 989.875 655.1552 989.875 764.6208 899.3534 853.333333 787.703267 853.333333H273.075c-131.959467 0-238.933333-104.8576-238.933333-234.1888 0-127.488 103.936-231.185067 233.301333-234.154666h8.635733C319.667 279.313067 425.309667 204.8 548.769933 204.8z m0 57.207467c-96.938667 0-182.852267 57.856-218.589866 144.418133l-14.677334 35.566933-39.1168 0.2048h-7.611733C170.913933 444.484267 92.509667 522.990933 92.509667 619.178667c0 97.723733 80.861867 176.9472 180.565333 176.9472h514.628267c79.394133 0 143.803733-63.0784 143.803733-140.936534 0-63.829333-43.7248-119.227733-105.5744-135.850666l-38.673067-10.410667-3.959466-39.1168c-11.946667-117.418667-113.186133-207.7696-234.530134-207.7696z m21.435734 114.449066a19.456 19.456 0 0 1 19.626666 19.2512v343.005867a19.456 19.456 0 0 1-19.626666 19.2512h-19.114667a19.456 19.456 0 0 1-19.626667-19.2512V395.707733a19.456 19.456 0 0 1 19.626667-19.2512h19.114667zM434.013667 529.066667a19.456 19.456 0 0 1 19.626666 19.2512v190.395733a19.456 19.456 0 0 1-19.6608 19.2512h-19.114666a19.456 19.456 0 0 1-19.626667-19.2512v-190.395733a19.456 19.456 0 0 1 19.626667-19.2512h19.114666z m-116.804267 57.2416a19.456 19.456 0 0 1 19.6608 19.217066v133.188267a19.456 19.456 0 0 1-19.6608 19.2512h-19.114667a19.456 19.456 0 0 1-19.626666-19.2512V605.525333a19.456 19.456 0 0 1 19.6608-19.217066h19.114666z m389.2224-114.449067a19.456 19.456 0 0 1 19.626667 19.217067v247.637333a19.456 19.456 0 0 1-19.626667 19.2512h-19.114667a19.456 19.456 0 0 1-19.626666-19.2512V491.076267a19.456 19.456 0 0 1 19.626666-19.217067h19.114667z"></path></symbol>`);

        const topBarElement = this.addTopBar({
            icon: "iconWeather",
            title: this.i18n.addTopBarIcon,
            position: "right",
            callback: () => {
                if (this.isMobile) {
                    this.addMenu();
                } else {
                    let rect = topBarElement.getBoundingClientRect();
                    // 如果被隐藏，则使用更多按钮
                    if (rect.width === 0) {
                        rect = document.querySelector("#barMore").getBoundingClientRect();
                    }
                    if (rect.width === 0) {
                        rect = document.querySelector("#barPlugins").getBoundingClientRect();
                    }
                    this.addMenu(rect);
                }
            }
        });

        // this.addCommand({
        //     langKey: "showDialog",
        //     hotkey: "⇧⌘O",
        //     callback: async () => {
        //         this.showDialog();
        //     },
        // });



        function handleProvinceSelect(event: Event) {
            let selectedOpt = (event.target as HTMLSelectElement).value;
            this.saveData(STORAGE_SETTINGS, {province: selectedOpt});
            console.log(selectedOpt);
            try {
                axios.get(WEATHER_SITE_API + "dict/province/" + selectedOpt, { responseType: 'json' }).then((response) => {
                    const ret = response.data;
                    if (ret["msg"] !== "success") {
                        throw Error("获取城市信息失败");
                    }
                    // console.log("citys: " + ret["data"]);
                    let cities: string[] = ret["data"].split('|');
                    selectCityElement.innerHTML = ""; // clear recent information
                    for (let i = 0; i < cities.length; i++) {
                        let optionElement = document.createElement('option');
                        let s = cities[i].split(',');
                        optionElement.value = s[0];
                        optionElement.text = s[1];
                        selectCityElement.appendChild(optionElement);
                    }
                    selectCityElement.dispatchEvent(new Event('change')); // call selectElement's change event
                })
            } catch (error) {
                console.error(error);
            }
        }
        function handleCitySelect(event: Event) {
            let selectedOpt = (event.target as HTMLSelectElement).value;
            console.log(selectedOpt);
            this.saveData(STORAGE_SETTINGS, {city: selectedOpt});
        }

        const selectProvinceElement: HTMLSelectElement = document.createElement('select');
        selectProvinceElement.className = "b3-select fn__flex-center fn__size200";
        selectProvinceElement.setAttribute("id", "weather-province-select");

        const selectCityElement: HTMLSelectElement = document.createElement('select');
        selectCityElement.className = "b3-select fn__flex-center fn__size200";
        selectCityElement.setAttribute("id", "weather-city-select");

        ["change"].forEach((event) => { // TODO: 似乎不会有更多事件需要监听
            selectProvinceElement.addEventListener(event, handleProvinceSelect.bind(this));
            selectCityElement.addEventListener(event, handleCitySelect.bind(this));
        });

        this.setting = new Setting({
            confirmCallback: () => {
                this.saveData(STORAGE_SETTINGS, {province: selectProvinceElement.value});
                this.saveData(STORAGE_SETTINGS, {city: selectCityElement.value});
            }
        });

        this.setting.addItem({
            title: "位置",
            createActionElement: () => {
                let locationDiv = document.createElement("div");
                locationDiv.setAttribute("id", "weather-location");
                locationDiv.style.flex = "flex";
                locationDiv.style.flexDirection = "row";
                locationDiv.appendChild(selectProvinceElement);
                locationDiv.appendChild(selectCityElement);
                return locationDiv;
            },
        });

        const setProvinceElements = (cities: readonlyWeatherCachedCity) => {
            dbg(cities);
            for (const [key, value] of Object.entries(cities)) {
                let optionElement = document.createElement('option');
                optionElement.value = key;
                optionElement.text = value.province;
                selectProvinceElement.appendChild(optionElement);
            }
            selectProvinceElement.dispatchEvent(new Event("change"));
        }
        // 获取所有省份名字，保存到缓存中，城市名字先为空，等到用户选择了省份之后再获取，到时同样保存到缓存中
        this.loadData(CACHED_CITYS).then(async (cityData : WeatherCachedCity) =>  {
            let cities = cityData;
            // 如果没有缓存，发起请求获取省份信息
            if (!cities) {
                dbg("Ask weather.cma.cn for province names");
                try {
                    await axios.get(WEATHER_SITE_API + "dict/province", { responseType: 'json' }).then((response) => {
                        const ret = response.data;
                        if (ret["msg"] !== "success") {
                            throw Error("获取省份信息失败");
                        }
                        const provinces: string[] = ret["data"].split('|');
                        const provinceMap_: WeatherCachedCity = {};
                        for (let i = 0; i < provinces.length; i++) {
                            const province_ = provinces[i].split(',');
                            provinceMap_[province_[0]] = {province: province_[1], cities: [] as string[]};
                        }
                        this.saveData(CACHED_CITYS, provinceMap_);
                        setProvinceElements(provinceMap_);
                    })
                } catch (error) {
                    console.error(error);
                }
            } else {
                // 缓存存在直接使用
                setProvinceElements(cityData)
            }

        });
    }

    onLayoutReady() {
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        if (isDevelopment) { // 方便调试
            // ? 省市不会经常变动吧，不需要清除缓存
            this.removeData(CACHED_CITYS);
        }

        console.log(this.i18n.byePlugin);
    }

    private async showDialog() {
        const dialog = new Dialog({
            title: "Info",
            content: `<div class="b3-dialog__content">
            <div class="plugin-sample__time">Weather: <span id="time"></span></div>
            </div>`,
            width: this.isMobile ? "92vw" : "560px",
            height: "540px",
        });

        if (this.data[STORAGE_SETTINGS]) {
            axios.get('https://weather.cma.cn/web/weather/' + this.data[STORAGE_SETTINGS].city + '.html').then((response) => {
                const weatherHtml = response.data.toString();
                let content = this.parseWeatherHtml(weatherHtml);
                dialog.element.querySelector("#time").innerHTML = content;
            });
        }

        // fetchPost("/api/system/currentTime", {}, (response) => {
        //     dialog.element.querySelector("#time").innerHTML = new Date(response.data).toString() + this.data[STORAGE_PROVINCE];
        // });
    }

    private addMenu(rect?: DOMRect) {
        const menu = new Menu("weatherTopBar", () => {
            console.log(this.i18n.byeMenu);
        });
        menu.addItem({
            icon: "iconInfo",
            label: "",
            accelerator: "",
            click: () => {
                this.showDialog();
            }
        });
        if (this.isMobile) {
            menu.fullscreen();
        } else {
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }
    }
}
