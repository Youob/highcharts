import U from '../../Core/Utilities.js';
import Dashboard from './../Dashboard.js';
import EditGlobals from '../EditMode/EditGlobals.js';
import { HTMLDOMElement } from '../../Core/Renderer/DOMElementType.js';
import EditRenderer from './EditRenderer.js';
import Resizer from './../Actions/Resizer.js';
import type Layout from './../Layout/Layout.js';
import CellEditToolbar from './Toolbars/CellToolbar.js';
import RowEditToolbar from './Toolbars/RowToolbar.js';
import OptionsToolbar from './Toolbars/OptionsToolbar.js';
import EditContextMenu from './EditContextMenu.js';

const {
    merge,
    css
} = U;

class EditMode {
    /* *
    *
    *  Static Properties
    *
    * */
    protected static readonly defaultOptions: EditMode.Options = {
        enabled: true
    }

    /* *
    *
    *  Constructor
    *
    * */
    constructor(
        dashboard: Dashboard,
        options: EditMode.Options|undefined
    ) {
        this.options = merge(EditMode.defaultOptions, options || {});
        this.dashboard = dashboard;
        this.lang = merge({}, EditGlobals.lang, this.options.lang);

        // Init renderer.
        this.renderer = new EditRenderer(this);

        if (
            this.options.contextMenu &&
            this.options.contextMenu.enabled
        ) {
            this.contextButtonElement = this.renderer.renderContextButton();
        }
    }

    /* *
    *
    *  Properties
    *
    * */

    private active: boolean = false;
    public options: EditMode.Options;
    public dashboard: Dashboard;
    public contextButtonElement?: HTMLDOMElement;
    public contextMenu?: EditContextMenu;
    public lang: EditGlobals.LangOptions;
    public renderer: EditRenderer;
    public cellToolbar?: CellEditToolbar;
    public rowToolbar?: RowEditToolbar;
    public optionsToolbar?: OptionsToolbar;

    /* *
    *
    *  Functions
    *
    * */

    public onContextBtnClick(
        editMode: EditMode
    ): void {
        // Init dropdown if doesn't exist.
        if (!editMode.contextMenu) {
            editMode.initContextMenu();
        }

        // Show context menu.
        if (editMode.contextMenu) {
            editMode.contextMenu.setVisible(
                !editMode.contextMenu.isVisible
            );
        }
    }

    public initContextMenu(): void {
        const editMode = this,
            contextButtonElement = editMode.contextButtonElement,
            width = 150;

        if (contextButtonElement) {
            editMode.contextMenu = new EditContextMenu(editMode, {
                style: {
                    width: width + 'px',
                    top: contextButtonElement.offsetTop +
                        contextButtonElement.offsetHeight + 'px',
                    left: contextButtonElement.offsetLeft - width +
                        contextButtonElement.offsetWidth + 'px'
                }
            });
        }
    }

    public onEditModeToggle(btnElement: HTMLDOMElement): void {
        const editMode = this;

        if (editMode.active) {
            editMode.deactivateEditMode(btnElement);
        } else {
            editMode.activateEditMode(btnElement);
        }
    }

    public activateEditMode(
        btnElement?: HTMLDOMElement
    ): void {
        const editMode = this,
            dashboard = editMode.dashboard;

        editMode.active = true;

        let layout;

        // Init resizers.
        for (let i = 0, iEnd = dashboard.layouts.length; i < iEnd; ++i) {
            layout = dashboard.layouts[i];

            if (!layout.resizer) {
                editMode.initLayoutResizer(layout);
            }
        }

        // Init cellToolbar.
        if (!editMode.cellToolbar) {
            editMode.cellToolbar = new CellEditToolbar(editMode);
        }

        // Init rowToolbar.
        if (!editMode.rowToolbar) {
            editMode.rowToolbar = new RowEditToolbar(editMode);
        }

        // Init optionsToolbar.
        if (!editMode.optionsToolbar) {
            editMode.optionsToolbar = new OptionsToolbar(editMode);
        }

        // Temp solution.
        if (btnElement) {
            css(btnElement, { color: 'rgb(49 216 71)' });
        }

        // Set edit mode active class to dashboard.
        editMode.dashboard.container.classList.add(
            EditGlobals.classNames.editModeEnabled
        );
    }

    public deactivateEditMode(
        btnElement?: HTMLDOMElement
    ): void {
        const editMode = this,
            dashboardCnt = editMode.dashboard.container;

        editMode.active = false;

        // Temp solution.
        if (btnElement) {
            css(btnElement, { color: '#555' });
        }

        dashboardCnt.classList.remove(
            EditGlobals.classNames.editModeEnabled
        );

        // Hide toolbars.
        if (editMode.cellToolbar) {
            editMode.cellToolbar.hide();
        }
        if (editMode.rowToolbar) {
            editMode.rowToolbar.hide();
        }
    }

    private initLayoutResizer(layout: Layout): void {
        const dashboard = this.dashboard,
            guiOptions = dashboard.options.gui;

        if (guiOptions) {
            if (guiOptions.layoutOptions.resize) {
                layout.resizer = new Resizer(layout);
            } else if (guiOptions.layoutOptions.resizerJSON) {
                layout.resizer = Resizer.fromJSON(
                    layout, guiOptions.layoutOptions.resizerJSON
                );
            }
        }
    }

    public isActive(): boolean {
        return this.active;
    }
}

namespace EditMode {
    export interface Options {
        enabled: boolean;
        contextMenu?: EditContextMenu.Options;
        lang?: EditGlobals.LangOptions|string;
    }
}

export default EditMode;
