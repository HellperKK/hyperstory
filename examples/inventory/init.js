$.inventory = [];
addComputed(["inventory[0]"], (equipement) => {
    return equipement === "sword"
}, "isRight");