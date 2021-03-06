import { template, notify } from "entcore";
import { models, workspaceService } from "../services";

export interface DragDelegateScope {
    //from others
    trees: models.ElementTree[]
    currentTree: models.ElementTree;
    isDraggingElement: boolean
    openedFolder: models.FolderContext
    onInit(cab: () => void);
    safeApply()
    selectedItems(): models.Element[];
    setMovingElements(elts: models.Element[])
    moveSubmit(dest: models.Element, elts?: models.Element[])
    copySubmit(dest: models.Element, elts?: models.Element[]):Promise<any>
    //
    //drag and drop
    countDragItems(): number
    lockDropzone: boolean
    isDropzoneEnabled(): boolean
    canDropOnElement(el: models.Element): boolean
    cannotDropSelectionOnElement(el: models.Element): boolean
    dropMove(origin: models.Element[], target: models.Element)
    drag(item: models.Element, event?: any)
    dragEnd(item: models.Element, event?: any)
    dragCondition(item: models.Element)
    dropTrash(item: models.Element[])
    dropCondition(item: models.Element, notifyError?: boolean): (event) => boolean
    dropTo(item: models.Element, event?: any)
    //
}
declare var jQuery;
export function DragDelegate($scope: DragDelegateScope) {
    let draggingItems: models.Element[] = []
    $scope.onInit(function () {
        //INIT
        $scope.isDraggingElement = false;
    });
    $scope.lockDropzone = false;
    $scope.isDropzoneEnabled = function () {
        //display drop zone only owner and shared tree
        if ($scope.currentTree.filter == "owner" || $scope.currentTree.filter == "shared") {
            return !$scope.lockDropzone;
        } else {//lock
            return false;
        }
    }
    $scope.countDragItems = function () {
        return draggingItems.length;
    }
    $scope.dragEnd = function (el, event: Event) {
        //wait until drop event finished
        setTimeout(() => {
            //reset
            $scope.lockDropzone = false;
            $scope.isDraggingElement = false;
            $scope.safeApply()
        }, 300)
    }
    $scope.dropMove = async function (origin, target) {
        template.close('lightbox');
        if ($scope.currentTree.filter == "shared") {
            await workspaceService.moveAllForShared(origin, target)
        } else {
            await workspaceService.moveAll(origin, target)
        }
    };

    $scope.drag = function (item, $originalEvent: DragEvent) {
        //clean null values and keep unique values
        draggingItems = [...$scope.selectedItems(), item].filter(item => !!item).filter((elem, pos, arr) => {
            return arr.indexOf(elem) == pos;
        });
        $scope.lockDropzone = true;
        try {
            const original = jQuery($originalEvent.target);
            const copy = original.clone().css({ position: "absolute", top: -10000, left: -1000, zoom: 0.5 }).addClass("zoomout-2x").insertAfter(original)
            $originalEvent.dataTransfer.setDragImage(copy[0], undefined, undefined);
        } catch (e) {
            console.warn(e)
        }
        //
        try {
            $originalEvent.dataTransfer.setData('application/json', JSON.stringify(item));
        } catch (e) {
            $originalEvent.dataTransfer.setData('Text', JSON.stringify(item));
        }
        //
        $scope.isDraggingElement = true;
        $scope.safeApply()
    };

    $scope.dragCondition = function (item) {
        return $scope.currentTree.filter == "owner" || $scope.currentTree.filter == "protected" || ($scope.currentTree.filter == "shared" && item.canMove);
    }

    $scope.dropCondition = function (targetItem, notifyError = false) {
        return function (event): boolean {
            if (!targetItem) {
                return false;
            }
            const originalTargetItem = targetItem;
            if (draggingItems.length == 0)
                return false
            //cannot drag on shared or protected tree
            const tree = (targetItem as models.Tree);
            const isTree = !!tree.filter;
            if (isTree && (tree.filter === 'shared' || tree.filter === 'protected'))
                return false
            //get real folder
            if (!isTree) {
                targetItem = workspaceService.findFolderInTrees($scope.trees, targetItem._id);
            }
            //if target not found in tree => search in opependFolder
            if (!targetItem) {
                targetItem = workspaceService.findFolderInTree($scope.openedFolder.folder, originalTargetItem._id);
            }
            //check after search
            if (!targetItem) {
                return false;
            }
            //cannot drop on owner root if already in it
            const itemsNotInOwnerRoot = draggingItems.filter(item => item.eParent || item.isShared || item.deleted);
            if(isTree && tree.filter=="owner" && itemsNotInOwnerRoot.length==0){
                return false;
            }
            //cannot drop on his parent
            if(targetItem._id){
                const itemsNotInTarget = draggingItems.filter(item=>item.eParent!=targetItem._id);
                if(itemsNotInTarget.length==0){
                    return false;
                }
            }
            //cannot drag on himself
            const targetIndex = draggingItems.filter(item => item === targetItem || (item && targetItem && item._id == targetItem._id))
            if (targetIndex.length > 0) {
                return false;
            }
            //can drop only on folder
            if (!isTree && targetItem.eType != models.FOLDER_TYPE) {
                return false;
            }
            //can drop on shared
            const fileIds = draggingItems.map(item => item._id);
            if (!isTree && targetItem.isShared && !targetItem.canCopyFileIdsInto(fileIds)) {
                notifyError && notify.error("workspace.contrib.cant")
                return false;
            }
            //else accept
            return true
        }
    }
    $scope.canDropOnElement = function (el) {
        return $scope.isDraggingElement && $scope.dropCondition(el)(null);
    }
    $scope.cannotDropSelectionOnElement = function (el) {
        if(!$scope.isDraggingElement ){
            return false; //if nothing selected => cannotdrop is false
        }
        return !$scope.dropCondition(el)(null);
    }

    $scope.dropTo = async function (targetItem, $originalEvent) {
        const can = $scope.dropCondition(targetItem, true)($originalEvent);
        if (!can)
            return;
        //if drop on trash => trash
        if ((targetItem as models.Tree).filter === 'trash') {
            $scope.dropTrash(draggingItems);
        } else {
            //if drop from apps=> copy
            if ($scope.currentTree.filter === 'protected') {
                $scope.copySubmit(targetItem, draggingItems)
                //notify.info("workspace.copied.toowner");
            } else {
                //else use classic workflow
                $scope.moveSubmit(targetItem as models.Element, draggingItems)
            }
        }
        draggingItems = [];
    };

    $scope.dropTrash = async function (item) {
        const res = workspaceService.trashAll(item);
        notify.info('workspace.removed.message');
        await res;
    };
}

