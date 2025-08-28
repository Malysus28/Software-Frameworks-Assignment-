import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Usersettings } from './usersettings';

describe('Usersettings', () => {
  let component: Usersettings;
  let fixture: ComponentFixture<Usersettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Usersettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Usersettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
