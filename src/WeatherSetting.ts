import { WeatherCachedCity, dbg, readonlyWeatherCachedCity, assert } from "./types";
import { Setting } from "siyuan";
import InsertWeatherPlugin from "./index";
import { getCities, getProvinces } from "./api";
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
            if (this.plugin.storageCities[selectedOpt].cities.length !== 0) {
                this.setCitiesElements(this.plugin.storageCities[selectedOpt].cities);
            } else {
                getCities(selectedOpt).then((data) => {
                    const cities: string[] = data.split("|");
                    this.plugin.storageCities[selectedOpt]['cities'] = cities;
                    this.setCitiesElements(cities);
                }).catch((e) => {
                    console.error(e);
                });
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
            dbg("Province names are not found! So get them now");
            getProvinces()
                .then((data) => {
                    const provinces: string[] = data.split("|");
                    const provinceMap_: WeatherCachedCity = {};
                    for (let i = 0; i < provinces.length; i++) {
                        const province_ = provinces[i].split(",");
                        provinceMap_[province_[0]] = { province: province_[1], cities: [] as string[] };
                    }
                    this.plugin.storageCities = provinceMap_;
                    this.setProvinceElements(provinceMap_);
                    if (this.plugin.storageSettings) {
                        this.selectProvinceElement.value = this.plugin.storageSettings.province;
                        this.selectProvinceElement.dispatchEvent(new Event("change"));
                        this.selectCityElement.value = this.plugin.storageSettings.city;
                    }
                })
                .catch(e => {
                    console.error(e);
                });
        } else { // 缓存存在直接使用
            this.setProvinceElements(this.plugin.storageCities);
            if (this.plugin.storageSettings) {
                this.selectProvinceElement.value = this.plugin.storageSettings.province;
                this.selectProvinceElement.dispatchEvent(new Event("change"));
                this.selectCityElement.value = this.plugin.storageSettings.city;
            }
        }
    }

    private setProvinceElements = (cities: readonlyWeatherCachedCity) => {
        this.selectProvinceElement.innerHTML = ""; // clear recent information
        for (const [key, value] of Object.entries(cities)) {
            const optionElement = document.createElement("option");
            optionElement.value = key; // something like "ABJ"
            optionElement.text = value.province; // something like "北京"
            this.selectProvinceElement.appendChild(optionElement);
        }
        this.selectProvinceElement.dispatchEvent(new Event("change"));
    };

    private setCitiesElements = (cities: string[]) => {
        this.selectCityElement.innerHTML = ""; // clear recent information
        for (let i = 0; i < cities.length; i++) {
            const optionElement = document.createElement("option");
            const s = cities[i].split(",");
            optionElement.value = s[0];
            optionElement.text = s[1];
            this.selectCityElement.appendChild(optionElement);
        }
        this.selectCityElement.dispatchEvent(new Event("change")); // call selectElement's change event
    }

}


