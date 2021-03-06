/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LoginPage } from '@alfresco/adf-testing';
import { NavigationBarPage } from '../pages/adf/navigation-bar.page';
import { ProcessServicesPage } from '../pages/adf/process-services/process-services.page';
import { TasksPage } from '../pages/adf/process-services/tasks.page';
import { TasksListPage } from '../pages/adf/process-services/tasks-list.page';
import { TaskDetailsPage } from '../pages/adf/process-services/task-details.page';
import { ProcessServiceTabBarPage } from '../pages/adf/process-services/process-service-tab-bar.page';
import { AppSettingsTogglesPage } from '../pages/adf/process-services/dialog/app-settings-toggles.page';
import { TaskFiltersDemoPage } from '../pages/adf/demo-shell/process-services/task-filters-demo.page';
import { AlfrescoApiCompatibility as AlfrescoApi, UserProcessInstanceFilterRepresentation } from '@alfresco/js-api';
import { AppsActions } from '../actions/APS/apps.actions';
import { UsersActions } from '../actions/users.actions';
import { browser } from 'protractor';
import { User } from '../models/APS/user';

describe('Task', () => {

    describe('Filters', () => {

        const loginPage = new LoginPage();
        const navigationBarPage = new NavigationBarPage();
        const processServicesPage = new ProcessServicesPage();
        const tasksPage = new TasksPage();
        const tasksListPage = new TasksListPage();
        const taskDetailsPage = new TaskDetailsPage();
        const taskFiltersDemoPage = new TaskFiltersDemoPage();

        const app = browser.params.resources.Files.APP_WITH_DATE_FIELD_FORM;
        let appId: number, user: User;

        beforeAll(async () => {
            this.alfrescoJsApi = new AlfrescoApi({
                provider: 'BPM',
                hostBpm: browser.params.testConfig.adf_aps.host
            });
        });

        beforeEach(async () => {

            const apps = new AppsActions();
            const users = new UsersActions();

            await this.alfrescoJsApi.login(browser.params.testConfig.adf.adminEmail, browser.params.testConfig.adf.adminPassword);
            user = await users.createTenantAndUser(this.alfrescoJsApi);

            await this.alfrescoJsApi.login(user.email, user.password);
            const { id } = await apps.importPublishDeployApp(this.alfrescoJsApi, app.file_location);
            appId = id;

            await loginPage.loginToProcessServicesUsingUserModel(user);
            await navigationBarPage.navigateToProcessServicesPage();
            await processServicesPage.checkApsContainer();
            await processServicesPage.goToApp(app.title);

        });

        afterEach(async () => {
            await this.alfrescoJsApi.activiti.modelsApi.deleteModel(appId);
            await this.alfrescoJsApi.login(browser.params.testConfig.adf.adminEmail, browser.params.testConfig.adf.adminPassword);
            await this.alfrescoJsApi.activiti.adminTenantsApi.deleteTenant(user.tenantId);
        });

        it('[C279967] Should display default filters when an app is deployed', async () => {
            await taskFiltersDemoPage.involvedTasksFilter().checkTaskFilterIsDisplayed();
            await taskFiltersDemoPage.myTasksFilter().checkTaskFilterIsDisplayed();
            await taskFiltersDemoPage.queuedTasksFilter().checkTaskFilterIsDisplayed();
            await taskFiltersDemoPage.completedTasksFilter().checkTaskFilterIsDisplayed();
        });

        it('[C260330] Should display Task Filter List when app is in Task Tab', async () => {
            await tasksPage.createTask({name: 'Test'});
            await taskFiltersDemoPage.myTasksFilter().clickTaskFilter();
            await tasksListPage.checkContentIsDisplayed('Test');
            await expect(await taskFiltersDemoPage.checkActiveFilterActive()).toBe('My Tasks');
            await expect(await taskDetailsPage.checkTaskDetailsDisplayed()).toBeDefined();

            await taskFiltersDemoPage.queuedTasksFilter().clickTaskFilter();
            await expect(await taskFiltersDemoPage.checkActiveFilterActive()).toBe('Queued Tasks');
            await tasksListPage.checkContentIsNotDisplayed('Test');
            await expect(await taskDetailsPage.checkTaskDetailsEmpty()).toBeDefined();

            await taskFiltersDemoPage.involvedTasksFilter().clickTaskFilter();
            await expect(await taskFiltersDemoPage.checkActiveFilterActive()).toBe('Involved Tasks');
            await tasksListPage.checkContentIsDisplayed('Test');
            await expect(await taskDetailsPage.checkTaskDetailsDisplayed()).toBeDefined();

            await taskFiltersDemoPage.completedTasksFilter().clickTaskFilter();
            await expect(await taskFiltersDemoPage.checkActiveFilterActive()).toBe('Completed Tasks');
            await tasksListPage.checkContentIsNotDisplayed('Test');
            await expect(await taskDetailsPage.checkTaskDetailsEmpty()).toBeDefined();
        });

        it('[C260348] Should display task in Complete Tasks List when task is completed', async () => {
            await taskFiltersDemoPage.myTasksFilter().checkTaskFilterIsDisplayed();
            await taskFiltersDemoPage.queuedTasksFilter().checkTaskFilterIsDisplayed();
            await taskFiltersDemoPage.involvedTasksFilter().checkTaskFilterIsDisplayed();
            await taskFiltersDemoPage.completedTasksFilter().checkTaskFilterIsDisplayed();

            await taskFiltersDemoPage.myTasksFilter().checkTaskFilterIsDisplayed();
            await taskFiltersDemoPage.queuedTasksFilter().checkTaskFilterIsDisplayed();
            await taskFiltersDemoPage.involvedTasksFilter().checkTaskFilterIsDisplayed();
            await taskFiltersDemoPage.completedTasksFilter().checkTaskFilterIsDisplayed();

            const task = await tasksPage.createNewTask();
            await task.addName('Test');
            await task.clickStartButton();
            await taskFiltersDemoPage.myTasksFilter().clickTaskFilter();
            await tasksListPage.checkContentIsDisplayed('Test');
            await expect(await taskFiltersDemoPage.checkActiveFilterActive()).toBe('My Tasks');
            await expect(await taskDetailsPage.checkTaskDetailsDisplayed()).toBeDefined();

            await taskFiltersDemoPage.queuedTasksFilter().clickTaskFilter();
            await expect(await taskFiltersDemoPage.checkActiveFilterActive()).toBe('Queued Tasks');
            await expect(await tasksListPage.getNoTasksFoundMessage()).toBe('No Tasks Found');
            await expect(await taskDetailsPage.getEmptyTaskDetailsMessage()).toBe('No task details found');

            await taskFiltersDemoPage.involvedTasksFilter().clickTaskFilter();
            await expect(await taskFiltersDemoPage.checkActiveFilterActive()).toBe('Involved Tasks');
            await tasksListPage.checkContentIsDisplayed('Test');
            await expect(await taskDetailsPage.checkTaskDetailsDisplayed()).toBeDefined();

            await taskFiltersDemoPage.completedTasksFilter().clickTaskFilter();
            await expect(await taskFiltersDemoPage.checkActiveFilterActive()).toBe('Completed Tasks');
            await expect(await tasksListPage.getNoTasksFoundMessage()).toBe('No Tasks Found');
            await expect(await taskDetailsPage.getEmptyTaskDetailsMessage()).toBe('No task details found');
        });

        it('[C260349] Should sort task by name when Name sorting is clicked', async () => {
            await tasksPage.createTask({name: 'Test1'});
            await taskDetailsPage.clickCompleteTask();

            await tasksPage.createTask({name: 'Test2'});
            await taskDetailsPage.clickCompleteTask();

            await tasksPage.createTask({name: 'Test3'});
            await tasksPage.createTask({name: 'Test4'});

            await tasksListPage.checkContentIsDisplayed('Test4');
            await tasksListPage.checkRowIsSelected('Test4');
            await tasksListPage.checkContentIsDisplayed('Test3');
            await taskDetailsPage.checkTaskDetailsDisplayed();

            await tasksPage.clickSortByNameAsc();
            await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe('Test3');
            await tasksPage.clickSortByNameDesc();
            await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe('Test4');

            await taskFiltersDemoPage.completedTasksFilter().clickTaskFilter();
            await tasksListPage.checkContentIsDisplayed('Test1');
            await tasksListPage.checkContentIsDisplayed('Test2');
            await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe('Test2');

            await tasksPage.clickSortByNameAsc();
            await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe('Test1');

            await taskFiltersDemoPage.involvedTasksFilter().clickTaskFilter();
            await tasksListPage.checkContentIsDisplayed('Test3');
            await tasksListPage.checkContentIsDisplayed('Test4');
        });

        it('[C277264] Should display task filter results when task filter is selected', async () => {
            await tasksPage.createTask({name: 'Test'});

            await taskFiltersDemoPage.myTasksFilter().clickTaskFilter();
            await tasksListPage.checkContentIsDisplayed('Test');
            await expect(await taskDetailsPage.getTaskDetailsTitle()).toBe('Test');
        });
    });

    describe('Custom Filters', () => {

        const loginPage = new LoginPage();
        const navigationBarPage = new NavigationBarPage();
        const processServicesPage = new ProcessServicesPage();
        const processServiceTabBarPage = new ProcessServiceTabBarPage();
        const appSettingsToggles = new AppSettingsTogglesPage();
        const taskFiltersDemoPage = new TaskFiltersDemoPage();

        let user;
        let appId: number;

        const app = browser.params.resources.Files.APP_WITH_PROCESSES;

        beforeAll(async () => {
            const apps = new AppsActions();
            const users = new UsersActions();

            this.alfrescoJsApi = new AlfrescoApi({
                provider: 'BPM',
                hostBpm: browser.params.testConfig.adf_aps.host
            });

            await this.alfrescoJsApi.login(browser.params.testConfig.adf.adminEmail, browser.params.testConfig.adf.adminPassword);
            user = await users.createTenantAndUser(this.alfrescoJsApi);

            await this.alfrescoJsApi.login(user.email, user.password);
            const importedApp = await apps.importPublishDeployApp(this.alfrescoJsApi, app.file_location);
            const appDefinitions = await this.alfrescoJsApi.activiti.appsApi.getAppDefinitions();
            appId = appDefinitions.data.find((currentApp) => currentApp.modelId === importedApp.id).id;

            await loginPage.loginToProcessServicesUsingUserModel(user);
        });

        afterAll( async () => {
            await this.alfrescoJsApi.login(browser.params.testConfig.adf.adminEmail, browser.params.testConfig.adf.adminPassword);
            await this.alfrescoJsApi.activiti.adminTenantsApi.deleteTenant(user.tenantId);
        });

        beforeEach(async () => {
            await navigationBarPage.navigateToProcessServicesPage();
            await processServicesPage.checkApsContainer();
            await processServicesPage.goToApp(app.title);
        });

        it('[C260350] Should display a new filter when a filter is added', async () => {
            const newFilter = new UserProcessInstanceFilterRepresentation({
                name: 'New Task Filter',
                appId,
                icon: 'glyphicon-filter',
                filter: { sort: 'created-desc', state: 'completed', assignment: 'involved' }
            });
            const { id } = await this.alfrescoJsApi.activiti.userFiltersApi.createUserTaskFilter(newFilter);

            await browser.refresh();
            await taskFiltersDemoPage.customTaskFilter('New Task Filter').checkTaskFilterIsDisplayed();
            await this.alfrescoJsApi.activiti.userFiltersApi.deleteUserTaskFilter(id);
        });

        it('[C286447] Should display the task filter icon when a custom filter is added', async () => {
            const newFilter = new UserProcessInstanceFilterRepresentation({
                name : 'New Task Filter with icon',
                appId,
                icon: 'glyphicon-cloud',
                filter: { sort: 'created-desc', state: 'completed', assignment: 'involved' }
            });
            const { id } = await this.alfrescoJsApi.activiti.userFiltersApi.createUserTaskFilter(newFilter);

            await browser.refresh();
            await processServiceTabBarPage.clickSettingsButton();
            await browser.sleep(500);
            await appSettingsToggles.enableTaskFiltersIcon();
            await processServiceTabBarPage.clickTasksButton();

            await taskFiltersDemoPage.customTaskFilter('New Task Filter with icon').checkTaskFilterIsDisplayed();
            await expect(await taskFiltersDemoPage.customTaskFilter('New Task Filter with icon').getTaskFilterIcon()).toEqual('cloud');
            await this.alfrescoJsApi.activiti.userFiltersApi.deleteUserTaskFilter(id);
        });

        it('[C286449] Should display task filter icons only when showIcon property is set on true', async () => {
            await taskFiltersDemoPage.myTasksFilter().checkTaskFilterHasNoIcon();

            await processServiceTabBarPage.clickSettingsButton();
            await appSettingsToggles.enableTaskFiltersIcon();
            await processServiceTabBarPage.clickTasksButton();

            await taskFiltersDemoPage.myTasksFilter().checkTaskFilterIsDisplayed();
            await expect(await taskFiltersDemoPage.myTasksFilter().getTaskFilterIcon()).toEqual('inbox');
        });
   });
});
