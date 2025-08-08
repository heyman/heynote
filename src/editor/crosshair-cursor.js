import { EditorView, ViewPlugin } from "@codemirror/view"


const showCrosshair = { style: "cursor: crosshair" };

/**
 * Modified version of CodeMirror's crosshairCursor that takes an eventFilter function instead of a key
 */
export function crosshairCursor(options = {}) {
    const filter = options.eventFilter ? options.eventFilter : e => e.altKey

    let plugin = ViewPlugin.fromClass(class {
        constructor(view) {
            this.view = view;
            this.isDown = false;
        }
        set(isDown) {
            if (this.isDown != isDown) {
                this.isDown = isDown;
                this.view.update([]);
            }
        }
    }, {
        eventObservers: {
            keydown(e) {
                //this.set(e.keyCode == code || getter(e));
                this.set(filter(e))
            },
            keyup(e) {
                this.set(false);
            },
            mousemove(e) {
                this.set(filter(e));
            }
        }
    });
    return [
        plugin,
        EditorView.contentAttributes.of(view => { var _a; return ((_a = view.plugin(plugin)) === null || _a === void 0 ? void 0 : _a.isDown) ? showCrosshair : null; })
    ];
}
