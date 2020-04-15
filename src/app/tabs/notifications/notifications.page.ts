import {Component, OnInit, LOCALE_ID, Inject, ViewChild, ElementRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NavController, AlertController, ModalController, ToastController} from '@ionic/angular';
import {Storage} from '@ionic/storage';
import {CommentsModalPage} from './comments/comments.page';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {LoadingController} from '@ionic/angular';
import {AppConfig} from '../../AppConfig';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.page.html',
    styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {
    @ViewChild('responses_ref', <any>[]) public responses_ref: ElementRef;
    @ViewChild('updates_needed_ref', <any>[]) public updates_needed_ref: ElementRef;
    @ViewChild('invites_ref', <any>[]) public invites_ref: ElementRef;
    userinfo: any;
    invites: any = [];
    notifications: any = [];
    updatesNeeded: {
        count: 0,
        data: {}
    };
    count_invites: any = 0;
    count_notifications: any = 0;
    servicedetail: any = {}
    sectionScroll: any;
    dataReturned: any;
    apiurl: any;
    contractorid: any;

    constructor(public modalCtrl: ModalController,
                public navCtrl: NavController,
                private  router: Router,
                public storage: Storage,
                private activatedRoute: ActivatedRoute,
                private alertCtrl: AlertController,
                @Inject(LOCALE_ID) private locale: string,
                public httpClient: HttpClient,
                public loadingController: LoadingController,
                public AppConfig: AppConfig,
                public toastController: ToastController,) {
        this.apiurl = this.AppConfig.apiurl;
    }

    logout() {
        console.log('logout clicked');
        this.storage.set('userdata', null);
        this.router.navigateByUrl('/login');
    }

    async getCurrentTheme() {
        var current_theme = this.storage.get('userdata').then((userdata) => {
            if (userdata && userdata.length !== 0) {
                //current_theme = userdata.theme.toLowerCase();
                return userdata.theme.toLowerCase();
            } else {
                return false;
            }
        })
        return current_theme;
    }

    async updateCurrentTheme(theme: string) {
        var userjson: object;
        await this.isLogged().then(result => {
            if (!(result == false)) {
                userjson = result;
            }
        })
        //console.log('from set current theme', userjson.theme);
        userjson['theme'] = theme.charAt(0).toUpperCase() + theme.slice(1);
        //console.log('from set current theme', userjson);
        this.storage.set('userdata', userjson);
        this.userinfo.theme = theme.charAt(0).toUpperCase() + theme.slice(1);
        console.log('updated theme on storage memory');
    }

    async switchTheme() {
        var current_theme;
        await this.getCurrentTheme().then((theme) => {
            console.log('the current theme is', theme);
            current_theme = theme;
        });
        var theme_switcher = {
            'dark': 'light',
            'light': 'dark'
        };
        var destination_theme = theme_switcher[current_theme]
        console.log('switching theme from:', current_theme);
        console.log('switching theme to:', destination_theme);
        document.body.classList.toggle(destination_theme, true);
        document.body.classList.toggle(current_theme, false);
        this.updateCurrentTheme(destination_theme);
        console.log('theme switched');
    }

    async isLogged() {
        var log_status = this.storage.get('userdata').then((userdata) => {
            if (userdata && userdata.length !== 0) {
                return userdata;
            } else {
                return false;
            }
        })
        return log_status;
    }

    loadTheme(theme) {
        console.log('loading theme', theme);
        document.body.classList.toggle(theme, true);
        var theme_switcher = {
            'dark': 'light',
            'light': 'dark'
        };
        document.body.classList.toggle(theme_switcher[theme], false); //switch off previous theme if there was one and prefer the loaded theme.
        console.log('turning off previous theme', theme_switcher[theme]);
    }

    ngOnInit() {
        this.hideLoading();
        this.activatedRoute.params.subscribe((userData) => {
            if (userData.length !== 0) {
                this.userinfo = userData;
                console.log('param user data:', userData);
                if (userData.fragment) {
                    console.log(userData.fragment)
                    try {
                        var element = document.getElementById(userData.fragment);
                        this.sectionScroll = element;
                    } catch (err) {
                        console.log(err);
                    }
                }
                try {
                    this.loadTheme(userData.theme.toLowerCase());
                } catch {
                    console.log('couldnt load theme');
                }
                console.log('param user data length:', userData.length);
                if (userData.length == undefined) {
                    console.log('nothing in params, so loading from storage');
                    this.isLogged().then(result => {
                        if (!(result == false)) {
                            console.log('loading storage data (within param route function)', result);
                            this.userinfo = result;
                            this.fetchInvites();
                            this.fetchUpdateNeeded();
                            this.loadTheme(result.theme.toLowerCase());
                            try {
                                console.log('scrolling to', this.sectionScroll);
                                this.sectionScroll.scrollIntoView();
                            } catch (err) {
                                //console.log(err);
                            }

                        } else {
                            console.log('nothing in storage, going back to login');
                            this.logout();
                        }
                    });
                }
            }
        });
        this.updatesNeeded = {
            count: 0,
            data: {}
        };
        //this.responses_ref.nativeElement.scrollIntoView({behavior: 'smooth', block: 'end', inline: 'start'});
    }

    async goToComments(id, notification = false) {
        console.log('Navigating to comments page for', id);
        if (notification == true) {
            var modal = await this.modalCtrl.create({
                component: CommentsModalPage,
                componentProps: {
                    'id': id,
                    'service_record_details': this.servicedetail,
                    'show_button': true,
                    'contractorInfo': this.userinfo
                }
            });
        } else {
            var modal = await this.modalCtrl.create({
                component: CommentsModalPage,
                componentProps: {
                    'id': id,
                    'service_record_details': this.servicedetail,
                    'contractorInfo': this.userinfo
                }
            });
        }

        modal.onDidDismiss().then((dataReturned) => {
            if (dataReturned !== null) {
                this.dataReturned = dataReturned.data;
            }
        });

        return await modal.present();
    }

    modifyInvite(choice, id) {
        console.log('action taken', choice, id);
        if (choice == 'question') {
            this.goToComments(id);
        }
        if (choice == 'accept') {
            //postInvite.php api
            var invite = this.invites.find(invite => invite.id == id);
            console.log(invite);
            invite.status = 'Accepted';
            this.postInviteStatus(invite.status, id);
        }
        if (choice == 'decline') {
            //postInivte.php api
            var invite = this.invites.find(invite => invite.id == id);
            console.log(invite);
            var index = this.invites.indexOf(invite);
            this.invites.splice(index, 1);
            invite.status = 'Declined';
            this.postInviteStatus(invite.status, id);
            this.count_invites--;
        }
    }

    markRead(id, recordid) {
        console.log('Going to record and marking notification as read', id);
        const reqData = {
            modcommentsid: id,
            fieldname : 'response_made',
            fieldValue : 0
        };
        const headers = new HttpHeaders();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Access-Control-Allow-Origin', '*');
        this.httpClient.post(this.apiurl + 'updateComment.php', reqData, {headers, observe: 'response'})
            .subscribe(data => {
                const responseData = data.body;
                const success = responseData['success'];
                if (success == true) {
                    this.hideLoading();
                    this.servicedetail = responseData['servicedetail'];
                    this.goToComments(recordid, true);
                } else {
                    this.hideLoading();
                }
            }, error => {
                this.hideLoading();
            });
    }
    
    fetchUpdateNeeded() {
        const contractorid = this.userinfo.contractorsid;
        const reqData = {
            contractor_id: contractorid
        };
        const headers = new HttpHeaders();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Access-Control-Allow-Origin', '*');
        this.httpClient.post(this.apiurl + 'getUpdateNeeded.php', reqData, {headers, observe: 'response'})
            .subscribe(data => {
                const responseData = data.body;
                console.log('Update Needed Response Data: ');
                console.log(responseData);
                const success = responseData['success'];
                if (success == true) {
                    this.updatesNeeded.count = responseData['count'];
                    this.updatesNeeded.data = responseData['data'];
                } else {
                    console.log('failed to fetch Update Needed');
                }
            }, error => {
                console.log('failed to fetch Update Needed');
            });
    }

    loading: any;

    async showLoading() {
        this.loading = await this.loadingController.create({
            message: 'Loading ...'
        });
        return await this.loading.present();
    }

    async hideLoading() {
        setTimeout(() => {
            if (this.loading != undefined) {
                this.loading.dismiss();
            }
        }, 500);
    }

    async presentToast(message: string) {
        var toast = await this.toastController.create({
            message: message,
            duration: 3500,
            position: 'bottom',
            color: 'danger'
        });
        toast.present();
    }

    async presentToastPrimary(message: string) {
        var toast = await this.toastController.create({
            message: message,
            duration: 2000,
            position: 'bottom',
            color: 'primary'
        });
        toast.present();
    }

    fetchInvites() {
        this.showLoading();
        const contractorid = this.userinfo.contractorsid;
        console.log('contractorid: ' + contractorid);
        const reqData = {
            contractorid
        };
        const headers = new HttpHeaders();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Access-Control-Allow-Origin', '*');
        this.httpClient.post(this.apiurl + 'getInvites.php', reqData, {headers, observe: 'response'})
            .subscribe(data => {
                console.log('Get Invites Success');
                const responseData = data.body;
                const success = responseData['success'];
                if (success == true) {
                    this.hideLoading();
                    const getInvites = responseData['data'];
                    this.invites = getInvites;
                    console.log(this.invites);
                    this.count_invites = getInvites.length;

                    const listResponses = responseData['responses'];
                    console.log(listResponses);
                    this.notifications = listResponses;
                    if (listResponses != undefined) {
                        this.count_notifications = listResponses.length;
                    }

                } else {
                    this.hideLoading();
                    console.log('failed to fetch Invites');
                }
            }, error => {
                this.hideLoading();
                console.log('failed to fetch Invites');
            });
    }

    async postInviteStatus(status: any, id: any) {
        this.showLoading();
        const invite_status = status;
        const contractorid = this.userinfo.contractorsid;
        const salesorderid = id;
        const updatefields = {
            status: invite_status,
            contractorid,
            salesorderid,
        };
        console.log(updatefields);
        const headers = new HttpHeaders();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Access-Control-Allow-Origin', '*');
        this.httpClient.post(this.apiurl + 'postInvite.php', updatefields, {headers, observe: 'response'})
            .subscribe(data => {
                this.hideLoading();
                const responseData = data.body;
                const success = responseData['success'];
                if (success == true) {
                    console.log('Push Invite Success!');
                    this.hideLoading();
                } else {
                    this.hideLoading();
                    console.log('failed to Push Invite');
                }
            }, error => {
                this.hideLoading();
                this.presentToast('failed to Push Invite \n' + error.message);
            });
    }

}
