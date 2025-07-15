import saveAsPng from "save-svg-as-png";
import { isDefined } from "../utils";

const dx = 0;
const dy = 0;

const SaveChartAsImage = {
	async save(doc, container, background) {
		const svg = container.getElementsByTagName("svg")[0];
		const uri = await saveAsPng.svgAsDataUri(svg, {});

		const image = await new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = uri;
		});

		const canvas = doc.createElement("canvas");
		canvas.width = image.width;
		canvas.height = image.height;

		const context = canvas.getContext("2d");

		if (isDefined(background)) {
			context.fillStyle = background;
			context.fillRect(0, 0, canvas.width, canvas.height);
		}

		const canvasList = container.getElementsByTagName("canvas");
		for (const each of canvasList) {
			if (isDefined(each)) {
				const parent = each.parentNode.parentNode.getBoundingClientRect();
				const rect = each.getBoundingClientRect();
				context.drawImage(each, rect.left - parent.left + dx, rect.top - parent.top + dy);
			}
		}

		context.drawImage(image, dx, dy);

		return canvas.toDataURL("image/png");
	},

	async saveWithWhiteBG(doc, container) {
		return this.save(doc, container, "white");
	},

	async saveWithDarkBG(doc, container) {
		return this.save(doc, container, "#303030");
	},

	async saveWithBG(doc, container, background) {
		return this.save(doc, container, background);
	},

	async saveChartAsImage(container) {
		const src = await this.saveWithWhiteBG(document, container);
		const a = document.createElement("a");
		a.setAttribute("href", src);
		a.setAttribute("download", "Chart.png");

		document.body.appendChild(a);
		a.addEventListener("click", () => {
			a.parentNode.removeChild(a);
		});

		a.click();
	},
};

export default SaveChartAsImage;
