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
import axios from "axios";
import * as cheerio from "cheerio";

import "./index.scss";
import {WEATHER_SITE_API, CACHED_CITYS, STORAGE_SETTINGS, DOCK_TYPE, assert, dbg, isDevelopment, WeatherCachedCity, readonlyWeatherCachedCity} from "./types";
import WeatherSetting from "./WeatherSetting";
let I18n = null;

export default class InsertWeatherPlugin extends Plugin {

    private isMobile: boolean;
    updateBindThis = this.update.bind(this);
    rightMenuItems: { [key: string]: { filter: string[], name: string, template: string } } = {};

    parseWeatherHtml(weatherHtml: string): string {
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

    onload() {
        this.data[CACHED_CITYS] = null as WeatherCachedCity;

        I18n = this.i18n;
        const frontEnd = getFrontend();
        this.rightMenuItems = {
            weather: {
                filter: ['tq', "today's weather"],
                name: this.i18n.weather,
                template: ''
            }
        };

        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconWeather" viewBox="0 0 1024 1024">
        <path d="M548.769933 204.8c152.439467 0 277.8112 113.698133 292.590934 259.310933C927.0014 487.082667 989.875 563.950933 989.875 655.1552 989.875 764.6208 899.3534 853.333333 787.703267 853.333333H273.075c-131.959467 0-238.933333-104.8576-238.933333-234.1888 0-127.488 103.936-231.185067 233.301333-234.154666h8.635733C319.667 279.313067 425.309667 204.8 548.769933 204.8z m0 57.207467c-96.938667 0-182.852267 57.856-218.589866 144.418133l-14.677334 35.566933-39.1168 0.2048h-7.611733C170.913933 444.484267 92.509667 522.990933 92.509667 619.178667c0 97.723733 80.861867 176.9472 180.565333 176.9472h514.628267c79.394133 0 143.803733-63.0784 143.803733-140.936534 0-63.829333-43.7248-119.227733-105.5744-135.850666l-38.673067-10.410667-3.959466-39.1168c-11.946667-117.418667-113.186133-207.7696-234.530134-207.7696z m21.435734 114.449066a19.456 19.456 0 0 1 19.626666 19.2512v343.005867a19.456 19.456 0 0 1-19.626666 19.2512h-19.114667a19.456 19.456 0 0 1-19.626667-19.2512V395.707733a19.456 19.456 0 0 1 19.626667-19.2512h19.114667zM434.013667 529.066667a19.456 19.456 0 0 1 19.626666 19.2512v190.395733a19.456 19.456 0 0 1-19.6608 19.2512h-19.114666a19.456 19.456 0 0 1-19.626667-19.2512v-190.395733a19.456 19.456 0 0 1 19.626667-19.2512h19.114666z m-116.804267 57.2416a19.456 19.456 0 0 1 19.6608 19.217066v133.188267a19.456 19.456 0 0 1-19.6608 19.2512h-19.114667a19.456 19.456 0 0 1-19.626666-19.2512V605.525333a19.456 19.456 0 0 1 19.6608-19.217066h19.114666z m389.2224-114.449067a19.456 19.456 0 0 1 19.626667 19.217067v247.637333a19.456 19.456 0 0 1-19.626667 19.2512h-19.114667a19.456 19.456 0 0 1-19.626666-19.2512V491.076267a19.456 19.456 0 0 1 19.626666-19.217067h19.114667z"></path></symbol>`);

        // ! don't know what's the use of the code below
        // const topBarElement = this.addTopBar({
        //     icon: "iconWeather",
        //     title: this.i18n.weatherReport,
        //     position: "right",
        //     callback: () => {
        //         if (this.isMobile) {
        //             this.addMenu();
        //         } else {
        //             let rect = topBarElement.getBoundingClientRect();
        //             // 如果被隐藏，则使用更多按钮
        //             if (rect.width === 0) {
        //                 rect = document.querySelector("#barMore").getBoundingClientRect();
        //             }
        //             if (rect.width === 0) {
        //                 rect = document.querySelector("#barPlugins").getBoundingClientRect();
        //             }
        //             this.addMenu(rect);
        //         }
        //     }
        // });

        this.updateSlash();
        this.addDock({
            config: {
                position: "RightTop",
                size: { width: 200, height: 0 },
                icon: "iconWeather",
                title: this.i18n.weatherReport,
                hotkey: "",
            },
            data: {
                text: this.i18n.notImplemented,
            },
            type: DOCK_TYPE,
            resize() {
                console.log(DOCK_TYPE + " resize");
            },
            update() {
                console.log(DOCK_TYPE + " update");
            },
            init: (dock) => {
                if (this.isMobile) {
                    dock.element.innerHTML = `
                        <div class="toolbar toolbar--border toolbar--dark">
                            <svg class="toolbar__icon"><use xlink:href="#iconEmoji"></use></svg>
                            <div class="toolbar__text">Custom Dock</div>
                        </div>
                        <div class="fn__flex-1 plugin-insert-weather__dock">${dock.data.text}</div>
                    </div>`;
                } else {
                    dock.element.innerHTML = `
                        <div class="fn__flex-1 fn__flex-column">
                            <div class="block__icons">
                                <div class="block__logo">
                                <!--  <svg class="block__logoicon"><use xlink:href="#iconEmoji"></use></svg>-->
                                    ${this.i18n.weatherReport}
                                </div>
                                <span class="fn__flex-1 fn__space"></span>
                                <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey("")}">
                                    <svg><use xlink:href="#iconMin"></use></svg>
                                </span>
                            </div>
                            <div class="fn__flex-1 plugin-insert-weather__dock">
                                ${dock.data.text}
                            </div>
                        </div>`;
                }
            },
            destroy() {
                console.log("destroy dock:", DOCK_TYPE);
            },
        });
        const setting = new WeatherSetting(this, {});
        this.setting = setting;
        setting.setUpElements();
        window.addEventListener('keypress', this.updateBindThis);

    }

    updateSlash() {
        this.protyleSlash = Object.values(this.rightMenuItems).map((template) => {
            return {
                filter: template.filter,
                html: `<span>${template.name} ${template.template}</span>`,
                id: template.name,
                callback: (protyle: Protyle) => {
                    let strnow = template.template;
                    console.log(template.name, strnow);
                    protyle.insert(strnow, false);
                },
                //@ts-ignore
                update() {
                    this.html = `<span>${template.name} ${template.template}</span>`;
                }
            }
        });
    }
    update(e: any) {
        if (e.key === '/') {
            this.protyleSlash.forEach((slash) => {
                dbg(slash);
                //@ts-ignore
                slash.update();
            })
        }
    }
    onLayoutReady() {
        // dbg(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    onunload() {
        window.removeEventListener('keypress', this.updateBindThis);
        if (isDevelopment) { // 方便调试
            // ? 省市不会经常变动吧，不需要清除缓存
            this.removeData(CACHED_CITYS);
        }

        console.log(this.i18n.byePlugin);
    }

    // private async showDialog() {
    //     const dialog = new Dialog({
    //         title: "Info",
    //         content: `<div class="b3-dialog__content">
    //         <div class="plugin-sample__time">Weather: <span id="time"></span></div>
    //         </div>`,
    //         width: this.isMobile ? "92vw" : "560px",
    //         height: "540px",
    //     });

    //     if (this.data[STORAGE_SETTINGS]) {
    //         axios.get("https://weather.cma.cn/web/weather/" + this.data[STORAGE_SETTINGS].city + ".html").then((response) => {
    //             const weatherHtml = response.data.toString();
    //             const content = this.parseWeatherHtml(weatherHtml);
    //             dialog.element.querySelector("#time").innerHTML = content;
    //         });
    //     }

    //     // fetchPost("/api/system/currentTime", {}, (response) => {
    //     //     dialog.element.querySelector("#time").innerHTML = new Date(response.data).toString() + this.data[STORAGE_PROVINCE];
    //     // });
    // }

    // private addMenu(rect?: DOMRect) {
    //     const menu = new Menu("weatherTopBar", () => {
    //         dbg(this.i18n.byeMenu);
    //     });
    //     menu.addItem({
    //         icon: "iconWeather",
    //         label: this.i18n.weatherReport,
    //         accelerator: "",
    //         click: () => {

    //         }
    //     });
    //     if (this.isMobile) {
    //         menu.fullscreen();
    //     } else {
    //         menu.open({
    //             x: rect.right,
    //             y: rect.bottom,
    //             isLeft: true,
    //         });
    //     }
    // }
}
