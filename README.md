# hyperstory
A lib to write branching stories using only html.


## how to use
Hyperstory provides en set a custom html elements to help building interractives stoires. Here's the list

### story-root
The root of the story in which you will add a list of scene and will manage whiche one is currently displayed.

### story-scene
The container for a part of the sorty, as there is only one scene displayed at a time. It has one property `id` which is used by `story-choice` to switch between scenes. An id can be any text as long as it is unique.

One scene can also have the `start` flag, which it set it as the scene to stat the game on.

### story-choice
A link to switch between scene. It has a property `to` which indicates the scene to go to.

### story-category
A container for a list of pages. It does nothing on its own but is useful for hiding its content when working in editors such as vscode.

### story-input
A special input that will save its content inside a state, pointed by the `name` property.

### story-data
A compontent that will dynamically retreive the content of a state, pointed by the `name` property.

### story-if
A component that only display depending of the state, pointed by the `if` proprety.

## code functionnnalities

You have acces to a global constant `$state` of which you can mutate the properties to trigger some reactivity in the game.
You can alose use two function to react to the changes made to `$state`:

### addSignal(dependencies, callback)

Will take an array and a callback and call the callback everytime a dependency has changed, passing the changed dependency to the callback.

example:
```js
addSignal(["hero.name"], (name) => console.log(`hero name is now ${name}`))
```

### addComputed(dependencies, callback, name)

Will take an array and a callback and call the callback everytime a dependency has changed, passing all the dépendencies to the callback.
Whill store the result to the property `name`

example:
```js
addComputed(["hero.firstName", "hero.lastName"], (firstName, lastName) => `${firstName} ${lastName}`, "hero.fullName")
```

## examples

You can find examples in the examples folder.
