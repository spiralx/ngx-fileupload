import { Directive, HostListener, Input, Output, EventEmitter, OnDestroy, Renderer2 } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { UploadModel, UploadState } from "../model/upload";
import { FileUpload } from "../services/file-upload";

/**
 * directive to add uploads with drag / drop
 *
 * @example
 *
 * <div [ngxFileUpload]="'URL'" (add)="onUploadAdd($event)" #myNgxFileUploadRef="ngxFileUploadRef"></div>
 * <button (click)="myNgxFileUploadRef.upload()">Upload</button>
 */
@Directive({
  selector: "[ngxFileUpload]",
  exportAs: "ngxFileUploadRef"
})
export class NgxFileUploadDirective implements OnDestroy {

    /**
     * upload has been added
     *
     * @example
     *
     * <div [ngxFileUpload]=""localhost/upload"" (add)="onUploadAdd($event)" ></div>
     */
    @Output()
    public add: EventEmitter<FileUpload[]>;

    /**
     * url which should be used as endpoint for the file upload
     * this field is mandatory
     *
     * @example
     * <div [ngxFileUpload]=""localhost/upload"" (add)="onUploadAdd($event)" ></div>
     */
    @Input("ngxFileUpload")
    public url: string;

    /**
     * if set to false upload post request body will use
     * plain file object in body
     */
    @Input()
    public useFormData = true;

    /**
     * form data field name with which form data will be send
     * by default this will be file
     */
    @Input()
    public formDataName = "file";

    /**
     * remove from subscribtions if component gets destroyed
     */
    private destroyed$: Subject<boolean> = new Subject();

    /**
     * upload file queue
     */
    private uploads: FileUpload[] = [];

    /**
     * input file field to trigger file window
     */
    private fileSelect: HTMLInputElement;

    /**
     * Creates an instance of NgxFileUploadDirective.
     */
    constructor(
        private httpClient: HttpClient,
        private renderer: Renderer2,
    ) {
        this.add = new EventEmitter();
        this.fileSelect = this.createFieldInputField();
    }

    /**
     * directive gets destroyed
     */
    public ngOnDestroy() {
        this.destroyed$.next(true);
        this.uploads = [];
        this.destroyed$.complete();
    }

    /**
     * begin all uploads at once
     */
    public uploadAll() {
        this.uploads.forEach((upload: FileUpload) => upload.start());
    }

    /**
     * cancel all downloads at once
     */
    public cancelAll() {
        for ( let i = this.uploads.length - 1; i >= 0; i --) {
            this.uploads[i].cancel();
        }
    }

    /**
     * search for broken uploads (error / invalid) and cancel
     * them
     */
    public cleanAll() {
        for ( let i = this.uploads.length - 1; i >= 0; i --) {
            const upload = this.uploads[i];
            if (upload.isInvalid() || upload.hasError()) {
                upload.cancel();
            }
        }
    }

    /**
     * handle drag over event
     */
    @HostListener("dragover", ["$event"])
    public onFileDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * handle drop event
     */
    @HostListener("drop", ["$event"])
    public onFileDrop(event: DragEvent) {

        event.stopPropagation();
        event.preventDefault();

        const files = Array.from(event.dataTransfer.files);
        this.handleFileSelect(files);
    }

    /**
     * add click host listener
     * to get notified we have a click event
     */
    @HostListener("click", ["$event"])
    public onClick(event: MouseEvent) {

        event.stopPropagation();
        event.preventDefault();

        if (!this.uploads.length) {
            this.fileSelect.click();
        }
    }

    /**
     * files has been selected via drag drop
     * or with input type="file"
     */
    private handleFileSelect(files: File[]) {
        const uploads = files.map((file) => this.createUpload(file));
        this.add.emit(uploads);
    }

    /**
     * create upload from file, listen to complete
     * to remove upload from uploads list
     *
     * remove uplaod from uploads repository if upload completed
     * or canceled
     */
    private createUpload(file: File): FileUpload {
        const uploadOptions = {
            url: this.url,
            formData: {
                enabled: this.useFormData,
                name   : this.formDataName
            }
        };

        const fileModel = new UploadModel(file);
        const upload    = new FileUpload(this.httpClient, fileModel, uploadOptions);

        this.preValidateUpload(fileModel);
        this.uploads.push(upload);

        const sub = upload.change
            .pipe(takeUntil(this.destroyed$))
            .subscribe({
                complete: () => {
                    this.uploads.splice(this.uploads.indexOf(upload), 1);
                    sub.unsubscribe();
                }
            });

        return upload;
    }

    /**
     * pre validate upload, if validation result is invalid
     * fill could not uploaded anymore
     */
    private preValidateUpload(upload: UploadModel) {
    }

    /**
     * create dummy input field to select files
     * for security reasons, we cant trigger a file select window
     * without it
     */
    private createFieldInputField(): HTMLInputElement {
        const inputField = document.createElement("input");
        this.renderer.setAttribute(inputField, "type", "file");
        this.renderer.setAttribute(inputField, "multiple", "multiple");
        this.renderer.setStyle(inputField, "display", "none");
        this.renderer.listen(inputField, "change", (e) => this.onFileSelect(e));
        return inputField;
    }

    /**
     * register on change event on input[type="file"] field
     * and create the uploads
     */
    private onFileSelect(event: Event) {
        event.stopPropagation();
        event.preventDefault();

        const files = Array.from(this.fileSelect.files);
        this.handleFileSelect(files);

        /**
         * clear value otherwise change will not trigger again
         */
        this.fileSelect.value = null;
        this.fileSelect.files = null;
    }
}
