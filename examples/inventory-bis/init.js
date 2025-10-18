$.inventory = {weapon: null};
addComputed(["inventory.weapon"], (equipement) => {
    return equipement === "sword"
}, "isRight");