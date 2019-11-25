import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';

import {NotifyService, SpinnerService, UserlistFiltersService, UserListService} from '../../../../../core/services';
import {GroupsStore} from '../../../../groups.store';
import {globalStore, StructureModel, UserModel} from '../../../../../core/store';
import {SelectOption} from '../../../../../shared/ux/components/multi-select/multi-select.component';
import {OrderPipe} from '../../../../../shared/ux/pipes';

@Component({
    selector: 'ode-group-input-users',
    templateUrl: './group-input-users.component.html',
    providers: [UserListService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupInputUsersComponent implements OnInit, OnDestroy {
    @Input() model: UserModel[] = [];

    private filtersUpdatesSubscriber: Subscription;

    // list elements stored by store pipe in list component
    // (takes filters in consideration)
    storedElements: UserModel[] = [];

    // Users selected by enduser
    selectedUsers: UserModel[] = [];

    structure: StructureModel;
    structures: StructureModel[] = [];

    structureOptions: SelectOption<StructureModel>[] = [];

    constructor(private groupsStore: GroupsStore,
                public userLS: UserListService,
                private spinner: SpinnerService,
                private ns: NotifyService,
                private cdRef: ChangeDetectorRef,
                private orderPipe: OrderPipe,
                public listFilters: UserlistFiltersService) {
    }

    ngOnInit(): void {
        this.structure = this.groupsStore.structure;
        this.structures = globalStore.structures.data;
        this.structureOptions = this.orderPipe.transform(this.structures, '+name')
            .map(structure => ({value: structure, label: structure.name}));

        this.filtersUpdatesSubscriber = this.listFilters.$updateSubject.subscribe(() => {
            this.cdRef.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this.filtersUpdatesSubscriber.unsubscribe();
    }

    selectUser(u: UserModel): void {
        if (this.selectedUsers.indexOf(u) === -1) {
            this.selectedUsers.push(u);
        } else {
            this.selectedUsers = this.selectedUsers.filter(su => su.id !== u.id);
        }
    }

    isSelected = (user: UserModel) => {
        return this.selectedUsers.indexOf(user) > -1;
    }

    selectAll(): void {
        this.selectedUsers = this.storedElements;
    }

    deselectAll(): void {
        this.selectedUsers = [];
    }

    structureChange(s: StructureModel): void {
        const selectedStructure: StructureModel = globalStore.structures.data.find(
            globalS => globalS.id === s.id);
        this.structure = selectedStructure;

        if (selectedStructure.users && selectedStructure.users.data
            && selectedStructure.users.data.length < 1) {
            this.spinner.perform('group-manage-users',
                selectedStructure.users.sync()
                    .then(() => {
                        this.model = selectedStructure.users.data
                            .filter(u =>
                                this.groupsStore.group.users.map(x => x.id).indexOf(u.id) === -1);
                        this.cdRef.markForCheck();
                    })
                    .catch((err) => {
                        this.ns.error(
                            {
                                key: 'notify.structure.syncusers.error.content'
                                , parameters: {structure: s.name}
                            }
                            , 'notify.structure.syncusers.error.title'
                            , err);
                    })
            );
        } else {
            this.model = selectedStructure.users.data
                .filter(u => this.groupsStore.group.users.map(x => x.id).indexOf(u.id) === -1);
            this.cdRef.markForCheck();
        }
    }

    addUsers(): void {
        this.spinner.perform('group-manage-users',
            this.groupsStore.group.addUsers(this.selectedUsers)
                .then(() => {
                    this.groupsStore.group.users = this.groupsStore.group.users.concat(this.selectedUsers);
                    this.model = this.model.filter(u => this.selectedUsers.indexOf(u) === -1);
                    this.selectedUsers = [];
                    this.ns.success('notify.group.manage.users.added.content');
                    this.cdRef.markForCheck();
                })
                .catch((err) => {
                    this.ns.error('notify.group.manage.users.added.error.content'
                        , 'notify.group.manage.users.added.error.title', err);
                })
        );
    }
}
