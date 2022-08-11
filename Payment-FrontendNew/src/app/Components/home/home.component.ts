import { Component, OnInit } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import {HttpClient} from "@angular/common/http";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Customer {
  accountNumber: string;
  clearBalance: number;
  customerName: string;
  overdraft: boolean;
}
interface TransferTypeCode {
  value: string;
  name: string;
}
 interface MessageType {
  messageCode: string;
  description: string;
}
 interface Bank {
  bic: string;
  name: string;
}
interface CurrencyType {
  code: string;
  name: string;
  value: number;
  symbol: string;
}
 interface TransactionRequest {
  payload: {
    customerId: string;
    amount: number;
    messageCode: string;
    receiverAccountNumber: string;
    receiverAccountName: string;
    receiverBIC: string;
    transferTypeCode: 'C' | 'O'
  }
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})


export class HomeComponent implements OnInit {
  sender!: FormGroup;
  receiver!: FormGroup;
  employee!: FormGroup
  transferTypeCodeList: Observable<TransferTypeCode[]> = of([]);
  messageCodes: Observable<MessageType[]> = of([])
  currencyTypes: CurrencyType[] = [
    {code: 'EUR', name: 'Euro', value: 84, symbol: '€'},
    {code: 'GBP', name: 'Great British Pound', value: 102, symbol: '£'},
    {code: 'INR', name: 'Indian Rupees', value: 1, symbol: '₹'},
    {code: 'JPY', name: 'Japanese Yen', value: 1, symbol: '¥'},
    {code: 'USD', name: 'US Dollar', value: 74, symbol: '$'}
  ]

  constructor(private fb: FormBuilder,private http:HttpClient) { 
    this.sender = fb.group({
      accountNumber: ['', [Validators.required, Validators.maxLength(14), Validators.minLength(14)]],
      customerName: [{value: '', disabled: true}],
      clearBalance: [{value: '', disabled: true}],
      senderBIC: [{value: 'HDFCINBBAHM', disabled: true}]
    })
    this.receiver = fb.group({
      receiverAccountNumber: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
      receiverAccountName: ['', Validators.required],
      receiverBIC: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      receiverBankName: [{value: '', disabled: true}]
    });
    this.employee = fb.group({
      transferTypeCode: ['', Validators.required],
      messageCode: ['', Validators.required],
      amount: ['', Validators.required],
      currencyType:['',Validators.required],
      totalAmount: [{value: 0, disabled: true}]
    })
  }

  ngOnInit(): void {
this.transferTypeCodeList=this.getTransferTypeCodes();
this.messageCodes=this.getMessageTypeCodes();
  }
  fetchDetails():any{
    this.getCustomerData(this.sender.value.accountNumber).subscribe(value => {
      console.log(JSON.stringify(value))
      this.sender.get('customerName')?.setValue(value.customerName);
      this.sender.get('clearBalance')?.setValue(value.clearBalance);
    })
  }
  fetchBIC():any{
    console.log(this.receiver)
    this.getBankDetails(this.receiver.value.receiverBIC).subscribe(value => {
      console.log(JSON.stringify(value))
      this.receiver.get('receiverBankName')?.setValue(value.name);
    })
  }

  getCustomerData(cid: string): Observable<Customer> {
    return this.http.get<Customer>('http://localhost:8080/api/customer/'+cid);
  }
  getBankDetails(bic:string):Observable<Bank>{
    return this.http.get<Bank>('http://localhost:8080/api/bank/'+bic);
  }
  getTransferTypeCodes(): Observable<TransferTypeCode[]> {
    return of([
      {value: 'C', name: 'Customer Transfer'},
      {value: 'O', name: 'Bank Transfer of Own'}
    ])
  }
  getMessageTypeCodes(): Observable<MessageType[]> {
    return this.http.get<MessageType[]>("http://localhost:8080/api/messageCode");
  }
  getCurrencyItem(currency:string) {
    return this.currencyTypes.find(val => val.code == currency) || this.currencyTypes[2];
  }
  updateINR(currencyType:string) {
  
    this.employee.get('totalAmount')?.setValue(this.getCurrencyItem(currencyType).value * this.employee.value.amount)
  }
  transactionRequest(transactionRequest:any): Observable<any> {
    console.log(transactionRequest)
    return this.http.post<any>("http://localhost:8080/api/transaction", transactionRequest).pipe(
      map(res => {
        console.log(JSON.stringify(res))
        //localStorage.setItem('lastMade', JSON.stringify(res));
        return res;
      })
    )
  }
 
  submit() {
  console.log(this.employee.get('totalAmount')?.value)
    const {
      accountNumber = '',
      amount = 0.0,
      messageCode = 'SUC',
      receiverAccountName = '',
      receiverAccountNumber = '',
      receiverBIC = '',
      transferTypeCode = ''
    } = {...this.employee.value,amount:this.employee.get('totalAmount')?.value, ...this.sender.value, ...this.receiver.value}
    console.log(this.employee.value,this.sender.value,this.receiver.value)
    const transactionRequest: TransactionRequest = {
      payload: {
        customerId: accountNumber,
        amount,
        messageCode,
        receiverAccountName,
        receiverAccountNumber,
        receiverBIC,
        transferTypeCode
      }
    }
    this.transactionRequest(transactionRequest.payload).subscribe(val => {
  console.log(val,"hio");
      // this.dialog.open(SuccessComponent)
      // this.lastTransaction = this.data.getLastTransaction();
      // this.matStepper.reset();
      // this.snack.open('Transaction is Successful', 'Dismiss', {
      //   duration: 1500
      // })
    },err=>console.log(err))
  }

}
