import {Component, OnInit, LOCALE_ID, Inject,} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {NavController, ToastController, AlertController, ModalController, LoadingController} from '@ionic/angular';
import {formatDate} from '@angular/common';
import {Storage} from '@ionic/storage';
import {ActionSheet, ActionSheetOptions} from '@ionic-native/action-sheet/ngx';
import {Camera, CameraOptions} from '@ionic-native/camera/ngx';
import {CommentsModalPage} from './comments/comments.page';
import {EmailComposer} from '@ionic-native/email-composer/ngx';
import {InAppBrowser} from '@ionic-native/in-app-browser/ngx';
import {HttpHeaders, HttpClient} from '@angular/common/http';
import {AppConfig} from '../../AppConfig';
import { ImageModalPage } from '../image-modal/image-modal.page';
import { DatePicker } from '@ionic-native/date-picker/ngx';
import { ImagePicker, ImagePickerOptions } from '@ionic-native/image-picker/ngx';

@Component({
    selector: 'app-detail',
    templateUrl: './detail.page.html',
    styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {
    userinfo: any;
    contractorinfo: any;
    serviceid: any;
    dataReturned: any;
    apiurl: any;
    isCompleteJob: number = 0;
    updatefields: any = {};
    status_picklist: any = ['Following Up', 'Waiting for a Reply', 'Mtg Scheduled', 'Complete'];
    secondaryInfo: any = {
        open: false,
    };
    date_sent: string;
    cf_738: string;
    service_time: string;
    serviceDateTime: string;
    csc_firstname: any;

    servicedetail: any = {};
    buttonLabels = ['Take Photo', 'Upload from Library'];

    customYearValues = [];

    actionOptions: ActionSheetOptions = {
        title: 'Which would you like to do?',
        buttonLabels: this.buttonLabels,
        addCancelButtonWithLabel: 'Cancel',
        androidTheme: 1 //this.actionSheet.ANDROID_THEMES.THEME_HOLO_DARK,
    }
    options: CameraOptions = {
        quality: 50,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        saveToPhotoAlbum: true //true causes crash probably due to permissions to access library. //task_id=46050
    }

    libraryOptions: CameraOptions = {
        quality: 100,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
    }

    constructor(public toastController: ToastController,
                public alertController: AlertController,
                public modalCtrl: ModalController,
                private actionSheet: ActionSheet,
                //private callNumber: CallNumber,
                private camera: Camera,
                public navCtrl: NavController,
                private  router: Router,
                public storage: Storage,
                private activatedRoute: ActivatedRoute,
                private emailComposer: EmailComposer,
                private httpClient: HttpClient,
                public AppConfig: AppConfig,
                public loadingController: LoadingController,
                private iab: InAppBrowser,
                private datePicker: DatePicker,
                private imagePicker: ImagePicker,
                @Inject(LOCALE_ID) private locale: string) {
        this.secondaryInfo.open = false;
        this.apiurl = this.AppConfig.apiurl;
        let curYear = new Date().getFullYear();
        let endYear = curYear + 2;
        let startYear = 2019;
        let diffYear = endYear - startYear;

        for (let i = 0; i <= diffYear; i++){
            this.customYearValues.push(startYear + i);
        }
    }

    loadDetails(serviceid) {
        this.servicedetail = [];
        console.log('loading details for service id:', serviceid)
        var params = {
            record_id: serviceid,
            contractorsid: this.userinfo.contractorsid,

        }
        this.showLoading();
        var headers = new HttpHeaders();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Access-Control-Allow-Origin', '*');
        this.httpClient.post(this.apiurl + 'getJobDetail.php', params, {headers: headers, observe: 'response'})
            .subscribe(data => {
                this.hideLoading();
                console.log(data['body']);
                var success = data['body']['success'];
                console.log('getJobDetail response was', success);
                if (success == true) {
                   // var workorder = data['body']['data'];
                    var allfields = data['body']['allfields'];
                    console.log('allfields are', allfields);
                    var status_picklist = data['body']['status_picklist'];
                    console.log(status_picklist);
                    if(status_picklist){
                        this.status_picklist = status_picklist;
                    }
                    this.servicedetail = allfields;
                    var csc_name = this.servicedetail.assigned_to;
                    this.csc_firstname = csc_name.split(" ")[0];
                    if (allfields.job_status == 'Released' || allfields.job_status == "Complete") {
                        this.isCompleteJob = 1;
                    }
                    /*this.date_sent = new Date(allfields.date_sent).toISOString();
                    this.cf_738 = new Date(allfields.cf_738).toISOString();*/
                    this.date_sent = allfields.cf_followupdate;
                    this.cf_738 = allfields.cf_738;
                    this.service_time = allfields.service_time;
                    this.serviceDateTime = allfields.service_date;
                    console.log('servicedetail', this.servicedetail);
                    console.log('modded dates', this.date_sent, this.cf_738);
                } else {
                    console.log('failed to fetch record');
                }

            }, error => {
                this.hideLoading();
                console.log('failed to fetch record');
            });
    }

    showTimePicker(fieldName) {
        var dateValue = new Date();
        if(fieldName == 'service_time') {
            dateValue = new Date(this.serviceDateTime);
        }
        this.datePicker.show({
            date: dateValue,
            mode: 'time',
            androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_DARK
        }).then(
            date => {
                if(fieldName == 'service_time') {
                    this.service_time = this.formatTime(date);
                }
                this.updatefields[fieldName] = this.formatTime(date, 1);
            },
            err => console.log('Error occurred while getting date: ', err)

        );
    }

    showDatePicker(fieldName) {
        console.log('aaa');
        var dateValue = new Date();
        if(fieldName == 'date_sent') {
            dateValue = new Date(this.date_sent);
        }
        else if(fieldName == 'cf_738') {
            dateValue = new Date(this.serviceDateTime);
        }
        this.datePicker.show({
            date: dateValue,
            mode: 'date',
            androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_DARK
        }).then(
            date => {
                if(fieldName == 'date_sent') {
                    this.date_sent = this.formatDate(date);
                }
                else if(fieldName == 'cf_738') {
                    this.cf_738 = this.formatDate(date);
                }
                this.updatefields[fieldName] = this.formatDate(date, 1);
            },
            err => console.log('Error occurred while getting date: ', err)

        );
    }

    formatDate(objDate, toDB=0) {
        var month = ('0' + (objDate.getMonth() + 1)).slice(-2);
        // make date 2 digits
        var date = ('0' + objDate.getDate()).slice(-2);
        // get 4 digit year
        var year = objDate.getFullYear();
        // concatenate into desired arrangement
        var shortDate = month + '-' + date + '-' + year;
        if(toDB == 1){
            var shortDate = year + '-' + month + '-' + date;
        }
        return shortDate;
    }
    formatTime(objDate, toDB=0) {
        var hours = objDate.getHours();
        var minutes = objDate.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = ('0' + minutes).slice(-2);
        hours = ('0' + hours).slice(-2);
        var timewithampm = hours + ':' + minutes + ' ' + ampm;
        if(toDB == 1){
            minutes = ('0' + objDate.getMinutes()).slice(-2);
            hours = ('0' + objDate.getHours()).slice(-2);
            var seconds = ('0' + objDate.getSeconds()).slice(-2);
            timewithampm = hours + ':' + minutes + ':' + seconds;
        }
        return timewithampm;
    }

    async clearDate(recordid) {
        var recordid = recordid;
        //cf_738 = Service Date
        const alert = await this.alertController.create({
            cssClass: 'modal-confirl-create-date',
            header: 'Clear Service Date?',
            subHeader: '',
            message: 'Do you want to clear the Service Date?',
            buttons: [
                {
                    text: 'No',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: (res) => {
                        //Disagree click
                    }
                }, {
                    text: 'Yes',
                    cssClass: 'primary',
                    handler: (res) => {
                        //Agree click
                        console.log('attempting to submitting data to vtiger');
                        this.clearServiceDate(recordid);
                    }
                }
            ]
        });

        await alert.present();
    }

    async clearServiceDate(salesorderid) {
        this.showLoading();
        var field = {
            cf_738: ''
        };
        var params = {
            recordid: salesorderid,
            contractorsid: this.userinfo.contractorsid,
            updates: JSON.stringify(field)
        }
        var headers = new HttpHeaders();
        headers.append("Accept", 'application/json');
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Access-Control-Allow-Origin', '*');
        this.httpClient.post(this.apiurl + 'postSOInfo.php', params, { headers: headers, observe: 'response' })
            .subscribe(data=> {
                this.hideLoading();
                var success = data['body']['success'];
                console.log(data['body']);
                if(success == true){
                    this.cf_738 = "";
                    this.presentToast('Service date cleared.');
                    console.log("Service date cleared.");
                }else{
                    this.presentToast('Failed to save due to an error');
                    console.log('failed to save record, response was false');
                }
                //this.router.navigateByUrl('/services');
            }, error => {
                this.hideLoading();
                this.presentToast('Failed to save due to an error \n' + error.message);
                console.log('failed to save record', error.message);
            });
    }

    async addUpdate(event) {
        console.log(this.updatefields);
        //console.log(event);
        var fieldname = event.target.name;
        var fieldvalue = event.target.textContent + event.target.value;
        if (event.target.tagName == 'ION-TEXTAREA' || event.target.tagName == 'ION-SELECT') {
            fieldvalue = event.target.value;
        }
        this.updatefields[fieldname] = fieldvalue;
        console.log('adding update to queue: ', fieldname, fieldvalue);
        console.log(this.updatefields);
        this.updateJob(this.servicedetail.salesorderid);
    }

    async completeJob(salesorderid) {
        var field = {
            job_status: 'Complete'
        };
        var params = {
            recordid: salesorderid,
            contractorsid: this.userinfo.contractorsid,
            updates: JSON.stringify(field)
        }
        var headers = new HttpHeaders();
        headers.append("Accept", 'application/json');
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Access-Control-Allow-Origin', '*');
        this.httpClient.post(this.apiurl + 'postSOInfo.php', params, { headers: headers, observe: 'response' })
            .subscribe(data=> {
                var success = data['body']['success'];
                console.log(data['body']);
                if(success == true){
                    console.log("Saved and updated data for jobs");
                }else{
                    this.presentToast('Failed to save due to an error');
                    console.log('failed to save record, response was false');
                }
                this.router.navigateByUrl('/services');
            }, error => {
                this.presentToast('Failed to save due to an error \n' + error.message);
                console.log('failed to save record', error.message);
            });
    }

    async saveJob(salesorderid) {
        var data = this.updatefields;
        var data_stringified = JSON.stringify(data);
        console.log('attempting to submitting data to vtiger', salesorderid, data);
        var params = {
            recordid: salesorderid,
            contractorsid: this.userinfo.contractorsid,
            updates: data_stringified
        }
        if (Object.keys(data).length > 0) {
            console.log('Some data was changed, pushing ' + Object.keys(data).length + ' changes');
            var headers = new HttpHeaders();
            headers.append("Accept", 'application/json');
            headers.append('Content-Type', 'application/x-www-form-urlencoded');
            headers.append('Access-Control-Allow-Origin', '*');
            this.showLoading();
            this.httpClient.post(this.apiurl + 'postSOInfo.php', params, { headers: headers, observe: 'response' })
                .subscribe(data=> {
                    this.hideLoading();
                    var success = data['body']['success'];
                    console.log(data['body']);
                    if(success == true){
                        console.log("Saved and updated data for jobs");
                        //this.router.navigateByUrl('/tabs/services');
                    }else{
                        this.presentToast('Failed to save due to an error');
                        console.log('failed to save record, response was false');
                    }
                }, error => {
                    this.hideLoading();
                    this.presentToast('Failed to save due to an error \n' + error.message);
                    console.log('failed to save record', error.message);
                });
        } else {
            this.hideLoading();
            console.log('no data modified for record', salesorderid);
        }

    }

    async updateJob(salesorderid) {
        var data = this.updatefields;
        var data_stringified = JSON.stringify(data);
        console.log('attempting to submitting data to vtiger', salesorderid, data);
        var params = {
            recordid: salesorderid,
            contractorsid: this.userinfo.contractorsid,
            updates: data_stringified
        }
        if (Object.keys(data).length > 0) {
            console.log('Some data was changed, pushing ' + Object.keys(data).length + ' changes');
            var headers = new HttpHeaders();
            headers.append("Accept", 'application/json');
            headers.append('Content-Type', 'application/x-www-form-urlencoded');
            headers.append('Access-Control-Allow-Origin', '*');
            //this.showLoading();
            this.httpClient.post(this.apiurl + 'postSOInfo.php', params, { headers: headers, observe: 'response' })
                .subscribe(data=> {
                    //this.hideLoading();
                    var success = data['body']['success'];
                    console.log(data['body']);
                    if(success == true){
                        console.log("Saved and updated data for jobs");
                        this.presentToast( 'Update saved');
                        //this.router.navigateByUrl('/tabs/services');
                    }else{
                        this.presentToast('Failed to save due to an error, please try again');
                        console.log('failed to save record, response was false');
                    }
                }, error => {
                    //this.hideLoading();
                    this.presentToast('Failed to save due to an error \n' + error.message);
                    console.log('failed to save record', error.message);
                });
        } else {
            //this.hideLoading();
            console.log('no data modified for record', salesorderid);
        }

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

   openCamera(serviceid) {
        console.log('launching camera');
        this.camera.getPicture(this.options).then((imageData) => {
            // imageData is either a base64 encoded string or a file URI
            // If it's base64 (DATA_URL):
            const base64Image = 'data:image/png;base64,' + imageData;
            this.AppConfig.base64img = imageData;
            //this.imgpov.setImage(imageData);
            console.log('Open Modal');
            this.openModal(serviceid, base64Image);
            // TODO: need code to upload to server here.
            // On success: show toast
            // this.presentToastPrimary('Photo uploaded and added! \n' + imageData);
        }, (err) => {
            // Handle error
            console.error(err);
            // On Fail: show toast
            if (err != 'no image selected') {
                this.presentToast(`Upload failed! Please try again \n` + err);
            }
        });
    }

    async openModal(serviceid, base64Image) {
        this.showLoading();
        console.log('In Modal');
        const modal = await this.modalCtrl.create({
            component: ImageModalPage,
            componentProps: {
                "base64Image": base64Image,
                "paramTitle": "Edit Photo",
                "serviceid" : serviceid,
            }
        });
        
        this.hideLoading(1000);
        
        modal.onDidDismiss().then((dataReturned) => {
            if (dataReturned !== null) {
                this.dataReturned = dataReturned.data;
                //alert('Modal Sent Data :'+ dataReturned);
            }
        });
        
        return await modal.present();
    }

    async presentToast(message: string) {
        var toast = await this.toastController.create({
            message: message,
            duration: 2000,
            position: 'top',
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

    async openMultiLibrary(serviceid) {
        console.log('launching gallery for multi select');

        let options: ImagePickerOptions = {
            outputType: 1
        };

        var imageResponse = [];
        await this.imagePicker.getPictures(options).then(async (results) => {
            if (results.length > 0) {
                for (var i = 0; i < results.length; i++) {
                    var bs64img = 'data:image/png;base64,' + results[i];
                    var imageBlob = this.dataURLtoBlob(bs64img);
                    await imageResponse.push(imageBlob);
                }
            }
        }, (err) => {
            console.log('err', err)
        });

        console.log('imageResponse', imageResponse);

        if (imageResponse.length > 0) {
            await this.uplodMultiFormImage(imageResponse, serviceid);
        } else {
            this.presentToast(`Upload failed! Please try again \n`);
        }
    }

    async uplodMultiFormImage(images, serviceid) {
        var formData = new FormData();

        for (var i = 0; i < images.length; i++) {
            formData.append("blob[]", images[i]);
        }
        formData.append("serviceid", serviceid);

        var headers = new HttpHeaders();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        headers.append('Access-Control-Allow-Origin', '*');

        this.showLoading();
        await this.httpClient.post(this.apiurl + "postFormPhotos.php", formData, {
            headers: headers,
            observe: 'response'
        })
            .subscribe(data => {
                this.hideLoading();
                if (data['body']['success'] == true) {
                    this.presentToastPrimary('Images successfully uploaded!');
                } else {
                    this.presentToast(`Upload failed! Please try again \n`);
                }
            }, error => {
                this.presentToast(`Upload failed! Please try again \n`);
            });
    }

    dataURLtoBlob(dataurl) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type: mime});
    }
    
   openLibrary(serviceid) {
        console.log('launching gallery');
        this.camera.getPicture(this.libraryOptions).then((imageData) => {
            // imageData is either a base64 encoded string or a file URI
            // If it's base64 (DATA_URL):
            let base64Image = 'data:image/png;base64,' + imageData;
            this.AppConfig.base64img = imageData;
            this.openModal(serviceid,base64Image);
            // TODO: need code to upload to server here.
            // On success: show toast
            //this.presentToastPrimary('Photo uploaded and added! \n' + imageData);
        }, (err) => {
            // Handle error
            console.error(err);
            // On Fail: show toast
            if (err != 'has no access to assets') {
                this.presentToast(`Upload failed! Please try again \n` + err);
            }
        });
    }

    ngOnInit() {
        this.activatedRoute.params.subscribe((userData) => {
            this.isLogged().then(result => {
                if (!(result == false)) {
                    console.log('loading storage data (within param route function)', result);
                    this.userinfo = result;
                    if (userData.serviceid) {
                        this.loadTheme(result.theme.toLowerCase());
                        this.loadDetails(userData.serviceid);
                    }
                } else {
                    console.log('nothing in storage, going back to login');
                    this.logout();
                }
            });
        });
    }

    async goToComments(id) {
        console.log('Navigating to comments page for', id);
        const modal = await this.modalCtrl.create({
            component: CommentsModalPage,
            componentProps: {
                'id': id,
                'service_record_details': this.servicedetail,
                'contractorInfo': this.userinfo
            }
        });

        modal.onDidDismiss().then((dataReturned) => {
            if (dataReturned !== null) {
                this.dataReturned = dataReturned.data;
            }
        });

        return await modal.present();
    }

    call(phonenumber) {
        console.log('calling ', phonenumber);
        /* this.callNumber.callNumber(phonenumber, true)
        .then(res => console.log("Launched dialer!", res))
        .catch(err => console.log("Error launching", err)) */
        //phonenumber = phonenumber.replace('(', '').replace(')', '').replace(' ','-');
        this.iab.create('tel:' + phonenumber, '_system');
    }

    sms(phonenumber) {
        console.log('smsing ', phonenumber);
        /* this.callNumber.callNumber(phonenumber, true)
        .then(res => console.log("Launched dialer!", res))
        .catch(err => console.log("Error launching", err)) */
        //phonenumber = phonenumber.replace('(', '').replace(')', '').replace(' ','-');
        this.iab.create('sms:' + phonenumber, '_system');
    }

    chat(recordid) {
        console.log('opening chat for ', recordid);
        /* this.callNumber.callNumber(phonenumber, true)
        .then(res => console.log("Launched dialer!", res))
        .catch(err => console.log("Error launching", err)) */
        this.goToComments(recordid);
    }

    email(email) {
        console.log('emailing ', email);
        this.iab.create('mailto:' + email, '_system');
        /* let emailtemplate = {
          to: email,
          cc: 'chukwumaokere@yahoo.com',
          isHtml: true,
        }
        this.emailComposer.isAvailable().then((available: boolean) => {
          if(available){
            //send
          }
        }) */
    }

    transferee(phonenumber) {        
        const contactLabels = ['Call: ' + phonenumber, 'SMS: ' + phonenumber];
        phonenumber = phonenumber.replace('(', '').replace(')', '').replace(' ','-');
        console.log('opening action sheet for contact ', phonenumber, this.servicedetail.cf_765 );
        const contactOptions: ActionSheetOptions = {
            title: 'Which would you like to do?',
            buttonLabels: contactLabels,
            addCancelButtonWithLabel: 'Cancel',
            androidTheme: 1 //this.actionSheet.ANDROID_THEMES.THEME_HOLO_DARK,
        }
        
        this.actionSheet.show(contactOptions).then((buttonIndex: number) => {
            console.log('Option pressed', buttonIndex);
            if (buttonIndex == 1) {
                this.call(phonenumber);
            }
            else if (buttonIndex == 2) {
                this.sms(phonenumber);
            }
        }).catch((err) => {
            console.log(err);
            this.presentToast(`Operation failed! \n` + err);
        })
    }

    contact(supportname) {
        console.log('opening action sheet for contact', supportname);
        const contactLabels = ['Call: ' + this.servicedetail.support_ph, 'Chat: ' + supportname, 'Email: ' + this.servicedetail.support_email];

        const contactOptions: ActionSheetOptions = {
            title: 'Which would you like to do?',
            buttonLabels: contactLabels,
            addCancelButtonWithLabel: 'Cancel',
            androidTheme: 1 //this.actionSheet.ANDROID_THEMES.THEME_HOLO_DARK,
        }
        this.actionSheet.show(contactOptions).then((buttonIndex: number) => {
            console.log('Option pressed', buttonIndex);
            if (buttonIndex == 1) {
                this.call(this.servicedetail.support_ph.replace('(', '').replace(')', '').replace(' ','-'));
            }
            else if (buttonIndex == 2) {
                this.chat(this.servicedetail.salesorderid);
            }
            else if (buttonIndex == 3) {
                this.email(this.servicedetail.support_email);
            }
        }).catch((err) => {
            console.log(err);
            this.presentToast(`Operation failed! \n` + err);
        })
    }

    toggleSecondary() {
        this.secondaryInfo.open = !this.secondaryInfo.open;
        console.log('secondary info is now', this.secondaryInfo.open);
    }

    loading: any;

    async showLoading() {
        this.loading = await this.loadingController.create({
            message: 'Loading ...'
        });
        return await this.loading.present();
    }

    async hideLoading(time: any = 500) {
        setTimeout(() => {
            if (this.loading != undefined) {
                this.loading.dismiss();
            }
        }, time);
    }
}
