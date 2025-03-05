# hyperstory
A lib to write branching stories using only html.


## how to use
Hyperstory provides en set a custom html elements to help building interractives stoires. Here's the list

### story-root
The root of the story in which you will add a list of scene and will manage whiche one is currently displayed.

### story-scene
The container for a part of the sorty, as there is only one scene displayed at a time. It has one property `id` which is used by `story-choice` to switch between scenes.

One scene can also have the `start` flag, which it set it as the scene to stat the game on.

### story-choice
A link to switch between scene. It has a property `to` which indicates the scene to go to. A choice can haxe an `if` property with a name; In that case, the choice will only be available when the correspondig state is truthy.

### story-category
A container for a list of pages. It does nothing on its own but is useful for hiding its content when working in editors such as vscode.

### story-input
A special input that will save its content inside a state, pointed by the `key` property.

### story-data
A compontent that will dynamically retreive the content of a state, pointed by the `key` property.

### story-if
A component that only display depending of the state, pointed by the `if` proprety.