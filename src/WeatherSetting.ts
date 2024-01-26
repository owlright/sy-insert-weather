import axios from "axios";
import { WEATHER_SITE_API, STORAGE_SETTINGS, CACHED_CITYS, WeatherCachedCity, dbg, readonlyWeatherCachedCity } from "./types";
import { Setting } from "siyuan";
import InsertWeatherPlugin from "./index";
export default class WeatherSettings extends Setting {
    selectProvinceElement: HTMLSelectElement;
    selectCityElement: HTMLSelectElement;
    plugin: InsertWeatherPlugin;
    constructor(plugin: InsertWeatherPlugin, options: {
        height?: string,
        width?: string,
        destroyCallback?: () => void,
        confirmCallback?: () => void,
    }) {
        super({
            height: options.height,
            width: options.width,
            confirmCallback: () => {
                try {
                    assert(this.selectProvinceElement.value !== "", "省份不能为空");
                    assert(this.selectCityElement.value !== "", "城市不能为空");
                    const city = this.selectCityElement.value + ',' + this.selectCityElement.selectedOptions[0].textContent;
                    assert(this.plugin.storageCities[this.selectProvinceElement.value].cities.includes(city), "不可能发生：省份和城市不匹配");
                    plugin.storageSettings = { province: this.selectProvinceElement.value, city: this.selectCityElement.value };
                } catch (e) {
                    dbg(e.message);
                    plugin.storageSettings = { province: null, city: null};
                }
            },
            destroyCallback: options.destroyCallback,
        });
        this.plugin = plugin;
        this.selectProvinceElement = document.createElement("select");
        this.selectProvinceElement.className = "b3-select fn__flex-center fn__size200";
        this.selectProvinceElement.setAttribute("id", "weather-province-select");

        this.selectCityElement = document.createElement("select");
        this.selectCityElement.className = "b3-select fn__flex-center fn__size200";
        this.selectCityElement.setAttribute("id", "weather-city-select");
    }
    public setUpElements(): void {
        const handleProvinceSelect = (event: Event) => {
            const selectedOpt = (event.target as HTMLSelectElement).value;
            console.log(selectedOpt);
            try {
                axios.get(WEATHER_SITE_API + "dict/province/" + selectedOpt, { responseType: "json" }).then((response) => {
                    const ret = response.data;
                    if (ret["msg"] !== "success") {
                        throw Error("获取城市信息失败");
                    }
                    // console.log("citys: " + ret["data"]);
                    const cities: string[] = ret["data"].split("|");
                    this.selectCityElement.innerHTML = ""; // clear recent information
                    for (let i = 0; i < cities.length; i++) {
                        const optionElement = document.createElement("option");
                        const s = cities[i].split(",");
                        optionElement.value = s[0];
                        optionElement.text = s[1];
                        this.selectCityElement.appendChild(optionElement);
                    }
                    this.selectCityElement.dispatchEvent(new Event("change")); // call selectElement's change event
                });
            } catch (error) {
                console.error(error);
            }
        };
        const handleCitySelect = (event: Event) => {
            const selectedOpt = (event.target as HTMLSelectElement).value;
            console.log(selectedOpt);
        };
        this.selectProvinceElement.addEventListener("change", handleProvinceSelect);
        this.selectCityElement.addEventListener("change", handleCitySelect);
        this.addItem({
            title: "位置",
            createActionElement: () => {
                const locationDiv = document.createElement("div");
                locationDiv.setAttribute("id", "weather-location");
                locationDiv.style.flex = "flex";
                locationDiv.style.flexDirection = "row";
                locationDiv.appendChild(this.selectProvinceElement);
                locationDiv.appendChild(this.selectCityElement);
                return locationDiv;
            },
        });
        // 获取所有省份名字，保存到缓存中，城市名字先为空，等到用户选择了省份之后再获取，到时同样保存到缓存中
        if (!this.plugin.storageCities) { // 如果没有缓存，发起请求获取省份信息
            }
        });
    }

    private setProvinceElements = (cities: readonlyWeatherCachedCity) => {
        dbg(cities);
        for (const [key, value] of Object.entries(cities)) {
            const optionElement = document.createElement("option");
            optionElement.value = key;
            optionElement.text = value.province;
            this.selectProvinceElement.appendChild(optionElement);
        }
        this.selectProvinceElement.dispatchEvent(new Event("change"));

    };

}


