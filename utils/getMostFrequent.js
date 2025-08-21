function getMostFrequent(arr, getValue) {
    const counts = new Map();

    let mostFrequentCount = 0;
    let mostFrequentItem;

    for (const item of arr) {
        const value = getValue ? getValue(item) : item;
        const count = (counts.get(value) || 0) + 1;
        
        counts.set(value, count);

        if (count > mostFrequentCount) {
            mostFrequentCount = count;
            mostFrequentItem = item;
        }
    }

    return mostFrequentItem;
}

module.exports = getMostFrequent;