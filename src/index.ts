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

import "./index.scss";
import {
    CACHED_CITYS,
    STORAGE_SETTINGS,
    DOCK_TYPE,
    dbg,
    isDevelopment,
    StoragedSetting,
    StoragedCache,
    assert,
} from "./types";
import WeatherSetting from "./WeatherSetting";
import { getTodayWeather, getProvinces, getCities } from "./api";
let I18n = null;

export default class InsertWeatherPlugin extends Plugin {

    private isMobile: boolean;
    updateBindThis = this.update.bind(this);
    rightMenuItems: { [key: string]: { filter: string[], name: string, content: string } } = {};
    storageSetting: StoragedSetting = null;

    cityCode: { [key: string]: string } = {};
    provinceCode: { [key: string]: string } = {};
    provinceCity: { [key: string]: string[] } = {};
    cachedOriginalData: { [key: string]: string[] } = {};

    async onload() {

        I18n = this.i18n;
        const frontEnd = getFrontend();
        this.rightMenuItems = {
            weather: {
                filter: ['tq', "today's weather"],
                name: I18n.weather,
                content: I18n.settingNotReady,
            }
        };

        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconWeather" viewBox="0 0 1024 1024">
        <path d="M548.769933 204.8c152.439467 0 277.8112 113.698133 292.590934 259.310933C927.0014 487.082667 989.875 563.950933 989.875 655.1552 989.875 764.6208 899.3534 853.333333 787.703267 853.333333H273.075c-131.959467 0-238.933333-104.8576-238.933333-234.1888 0-127.488 103.936-231.185067 233.301333-234.154666h8.635733C319.667 279.313067 425.309667 204.8 548.769933 204.8z m0 57.207467c-96.938667 0-182.852267 57.856-218.589866 144.418133l-14.677334 35.566933-39.1168 0.2048h-7.611733C170.913933 444.484267 92.509667 522.990933 92.509667 619.178667c0 97.723733 80.861867 176.9472 180.565333 176.9472h514.628267c79.394133 0 143.803733-63.0784 143.803733-140.936534 0-63.829333-43.7248-119.227733-105.5744-135.850666l-38.673067-10.410667-3.959466-39.1168c-11.946667-117.418667-113.186133-207.7696-234.530134-207.7696z m21.435734 114.449066a19.456 19.456 0 0 1 19.626666 19.2512v343.005867a19.456 19.456 0 0 1-19.626666 19.2512h-19.114667a19.456 19.456 0 0 1-19.626667-19.2512V395.707733a19.456 19.456 0 0 1 19.626667-19.2512h19.114667zM434.013667 529.066667a19.456 19.456 0 0 1 19.626666 19.2512v190.395733a19.456 19.456 0 0 1-19.6608 19.2512h-19.114666a19.456 19.456 0 0 1-19.626667-19.2512v-190.395733a19.456 19.456 0 0 1 19.626667-19.2512h19.114666z m-116.804267 57.2416a19.456 19.456 0 0 1 19.6608 19.217066v133.188267a19.456 19.456 0 0 1-19.6608 19.2512h-19.114667a19.456 19.456 0 0 1-19.626666-19.2512V605.525333a19.456 19.456 0 0 1 19.6608-19.217066h19.114666z m389.2224-114.449067a19.456 19.456 0 0 1 19.626667 19.217067v247.637333a19.456 19.456 0 0 1-19.626667 19.2512h-19.114667a19.456 19.456 0 0 1-19.626666-19.2512V491.076267a19.456 19.456 0 0 1 19.626666-19.217067h19.114667z"></path></symbol>`);

        const getProvinceCities = async (code_province: string) => {
            const province_ = code_province.split(",");
            const pCode = province_[0];
            const data = await getCities(pCode);
            const cities: string[] = data.split("|");
            this.cachedOriginalData[code_province] = cities;
        };

        await Promise.all([
            this.loadData(STORAGE_SETTINGS).then((settings: StoragedSetting) => {
                dbg(`load settings: ${settings.provinceCode} ${settings.cityCode}`);
                this.storageSetting = settings;
                const city = this.storageSetting.cityCode;
                if (city) {
                    getTodayWeather(city).then((weather) => {
                        this.rightMenuItems.weather.content = weather;
                    });
                }
            }), this.loadData(CACHED_CITYS).then(async (cities: StoragedCache) => {
                if (!cities) {
                    // "ABJ,北京|ATJ,天津|AHE,河北|ASX,山西|ANM,内蒙古|ALN,辽宁|AJL,吉林|AHL,黑龙江|ASH,上海|AJS,江苏|AZJ,浙江|AAH,安徽|AFJ,福建|AJX,江西|ASD,山东|AHA,河南|AHB,湖北|AHN,湖南|AGD,广东|AGX,广西|AHI,海南|ACQ,重庆|ASC,四川|AGZ,贵州|AYN,云南|AXZ,西藏|ASN,陕西|AGS,甘肃|AQH,青海|ANX,宁夏|AXJ,新疆|AXG,香港|AAM,澳门|ATW,台湾"
                    let getAllCityData : Promise<void>[] = [];
                    await getProvinces().then((data) => {
                        const code_province: string[] = data.split("|");
                        for (const val of code_province) {
                            this.cachedOriginalData[val] = [];
                            getAllCityData.push(getProvinceCities(val));
                        }
                    });
                    await Promise.all(getAllCityData);
                } else {
                    this.cachedOriginalData = cities;
                }
            }),
        ]);
        assert(this.provinceCode, "provinceCode is not initialized");
        assert(this.provinceCity, "provinceCity is not initialized");
        assert(this.cityCode, "cityCode is not initialized");
        assert(this.cachedOriginalData, "cachedOriginalData is not initialized");
        dbg(this.cachedOriginalData);

        Object.entries(this.cachedOriginalData).forEach(([code_province, code_cities]) => {
            const province_ = code_province.split(",");
            const pCode = province_[0];
            this.provinceCode[pCode] = province_[1];
            this.provinceCity[pCode] = [];
            code_cities.forEach((code_city) => {
                const city_ = code_city.split(",");
                this.cityCode[city_[0]] = city_[1];
                this.provinceCity[pCode].push(city_[0]);
            });
        });

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
                dbg(DOCK_TYPE + " resize");
            },
            update() {
                dbg(DOCK_TYPE + " update");
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
                dbg(`destroy dock:  ${DOCK_TYPE}`);
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
                html: `<span>${template.name} ${template.content}</span>`,
                id: template.name,
                callback: (protyle: Protyle) => {
                    let strnow = template.content;
                    protyle.insert(strnow, false);
                },
                //@ts-ignore
                update() {
                    this.html = `<span>${template.name} ${template.content}</span>`;
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
            // this.removeData(CACHED_CITYS);
        }
        dbg(this.i18n.byePlugin);
        this.saveData(CACHED_CITYS, this.cachedOriginalData);
        this.saveData(STORAGE_SETTINGS, this.storageSetting);
    }

}
