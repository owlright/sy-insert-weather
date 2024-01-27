import { dbg, assert } from "./types";
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
                    const cityCode =this.selectCityElement.value;
                    const pCode = this.selectProvinceElement.value;
                    assert(pCode !== "", "省份不能为空");
                    assert(cityCode !== "", "城市不能为空");
                    console.log(`保存 ${this.plugin.provinceCode[pCode]}, 城市：${this.plugin.cityCode[cityCode]}`);
                    plugin.storageSetting = { provinceCode: this.selectProvinceElement.value, cityCode: this.selectCityElement.value };
                } catch (e) {
                    dbg(e.message);
                    plugin.storageSetting = { provinceCode: null, cityCode: null};
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
            const plugin = this.plugin;
            const pCode = (event.target as HTMLSelectElement).value;
            const pName = plugin.provinceCode[pCode];
            const province = pCode + ',' + pName;
            console.log(`${province}`);
            this.addOptionElements(plugin.cachedOriginalData[province], this.selectCityElement);
        };

        const handleCitySelect = (event: Event) => {
            const selectedOpt = (event.target as HTMLSelectElement).value;
            console.log(`${selectedOpt}, ${plugin.cityCode[selectedOpt]}`);
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
        const plugin = this.plugin;

        this.addOptionElements(Object.keys(plugin.cachedOriginalData), this.selectProvinceElement);
        if (!plugin.storageSetting) {
            this.selectProvinceElement.options[0].selected = true;
            this.selectProvinceElement.dispatchEvent(new Event("change"));
        } else {
            const diseredProvince = plugin.storageSetting.provinceCode;
            const foundOption = Array.from(this.selectProvinceElement.options).find(option => option.value === diseredProvince);
            assert(foundOption, "不可能发生：存储的省份不存在");
            foundOption.selected = true;
            const province = diseredProvince + ',' + plugin.provinceCode[diseredProvince];
            this.addOptionElements(plugin.cachedOriginalData[province], this.selectCityElement);
            const diseredCity = plugin.storageSetting.cityCode;
            const foundOption2 = Array.from(this.selectCityElement.options).find(option => option.value === diseredCity);
            assert(foundOption, "不可能发生：找不到对应的城市");
            foundOption2.selected = true;
        }

    }

    private addOptionElements = (options: Readonly<string[]>, selectElement: HTMLSelectElement) => {
        selectElement.innerHTML = ""; // clear old information
        for (let i = 0; i < options.length; i++) {
            const optionElement = document.createElement("option");
            const s = options[i].split(",");
            optionElement.value = s[0];
            optionElement.text = s[1];
            selectElement.appendChild(optionElement);
        }
    }
}


