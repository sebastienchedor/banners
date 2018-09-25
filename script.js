const AREA_COEFFICIENT = 1;
const DEGRADATION_COEFFICIENT = 1;

const REDUCING_PREFERENCE = 1.2;
const DEFAULT_EXTREME_MAX = 3;
const DEFAULT_PERFECT_MAX = 1.1;
const DEFAULT_EXTREME_MIN = 1 / (DEFAULT_EXTREME_MAX * REDUCING_PREFERENCE);
const DEFAULT_PERFECT_MIN = 1 / (DEFAULT_PERFECT_MAX * REDUCING_PREFERENCE);


class imageSet {

    constructor(set) {
        let imageSet = [];
        for (var i in set) {
            let imageData = set[i];
            let realImage = document.createElement("img");
            realImage.setAttribute("src", imageData.src);
            let obj = {
                src: imageData.src,
                height: realImage.naturalHeight,
                width: realImage.naturalWidth,
                factors: computeLimitFactors(imageData)
            };
            imageSet.push(obj);
        }
        this.imageSet = imageSet;
    }

    selectImage(element) {
        if (this.imageSet.length === 0) throw "No image in the set";
        let width = element.offsetWidth;
        let height = element.offsetHeight;
        var currentReport = null;
        for (var i in this.imageSet) {
            let reports = makeInsertionReports(this.imageSet[i], width, height);
            for (var i in reports) {
                if (currentReport === null) currentReport = reports[i];
                currentReport = selectBetter(currentReport, reports[i]);

            }
        }
        if (!currentReport.isValid) throw "No valid image to insert";
        return currentReport;
    }
}

function computeLimitFactors(image) {
    let factors = {};
    factors.extremeMax = DEFAULT_EXTREME_MAX;
    factors.perfectMax = DEFAULT_PERFECT_MAX;
    factors.extremeMin = DEFAULT_EXTREME_MIN;
    factors.perfectMin = DEFAULT_PERFECT_MIN;

    if (!image.factors) return factors;
    if (image.factors.extremeMax) factors.extremeMax = image.factors.extremeMax;
    if (image.factors.perfectMax) factors.perfectMax = image.factors.perfectMax;
    if (image.factors.extremeMin) factors.extremeMin = image.factors.extremeMin;
    if (image.factors.perfectMin) factors.perfectMin = image.factors.perfectMin;
    return factors;
}

function computeFactor(image, targetWidth, targetHeight) {
    let factor;
    // select between height or width
    if (targetWidth * image.height > targetHeight * image.width) {
        factor = targetHeight/image.height;
    } else {
        factor = targetWidth/image.width;
    }
    if (factor > image.factors.extremeMax) return [image.factors.extremeMax];
    if (factor < image.factors.extremeMin) return [image.factors.extremeMax];
    if (factor > image.factors.perfectMax) return [factor, image.factors.perfectMax];
    if (factor < image.factors.perfectMin) return [factor, image.factors.perfectMin];
    return [factor];
}

function computeDegradation(factor, factors) {
    let res = 0;
    if (factor > factors.perfectMax) {
        res = (factor - factors.perfectMax) / (factors.extremeMax - factors.perfectMax);
    }
    if (factor < factors.perfectMin) {
        res = (factor - factors.perfectMin) / (factors.extremeMin - factors.perfectMin);
    }
    return res;
}

function makeInsertionReports(image, targetWidth, targetHeight) {
    let factors = computeFactor(image, targetWidth, targetHeight);
    let reports = [];
    for (var i in factors) {
        let finalHeight = Math.floor(image.height * factors[i]);
        let finalWidth = Math.floor(image.width * factors[i]);
        reports.push({
            src: image.src,
            factor: factors[i],
            height: finalHeight,
            width: finalWidth,
            degradation: computeDegradation(factors[i], image.factors),
            emptyAreaProportion: 1 - (finalHeight * finalWidth) / (targetHeight * targetWidth),
            isValid: finalHeight > targetHeight || finalWidth > targetWidth ? false : true
        });
    }
    return reports;
}

function selectBetter(reportA, reportB) {
    if (!reportB.isValid) return reportA;
    if (!reportA.isValid) return reportB;

    if (reportA.degradation === 0 && reportB.degradation === 0) {
        if (reportA.emptyAreaProportion < reportB.emptyAreaProportion) return reportA;
        return reportB;
    }

    let scoreA = AREA_COEFFICIENT * reportA.emptyAreaProportion + DEGRADATION_COEFFICIENT * reportA.degradation;
    let scoreB = AREA_COEFFICIENT * reportB.emptyAreaProportion + DEGRADATION_COEFFICIENT * reportB.degradation;

    if (scoreA < scoreB) return reportA
    return reportB;
}
