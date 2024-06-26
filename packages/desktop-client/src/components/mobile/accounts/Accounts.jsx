import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { replaceModal, syncAndDownload } from 'loot-core/src/client/actions';
import * as queries from 'loot-core/src/client/queries';

import { useAccounts } from '../../../hooks/useAccounts';
import { useCategories } from '../../../hooks/useCategories';
import { useLocalPref } from '../../../hooks/useLocalPref';
import { useNavigate } from '../../../hooks/useNavigate';
import { useSetThemeColor } from '../../../hooks/useSetThemeColor';
import { SvgAdd } from '../../../icons/v1';
import { theme, styles } from '../../../style';
import { Button } from '../../common/Button';
import { Text } from '../../common/Text';
import { TextOneLine } from '../../common/TextOneLine';
import { View } from '../../common/View';
import { Page } from '../../Page';
import { CellValue } from '../../spreadsheet/CellValue';
import { MOBILE_NAV_HEIGHT } from '../MobileNavTabs';
import { PullToRefresh } from '../PullToRefresh';

function AccountHeader({ name, amount, style = {} }) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        marginTop: 10,
        marginRight: 10,
        color: theme.pageTextLight,
        width: '100%',
        ...style,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...styles.text,
            textTransform: 'uppercase',
            fontSize: 13,
          }}
          data-testid="name"
        >
          {name}
        </Text>
      </View>
      <CellValue
        binding={amount}
        style={{ ...styles.text, fontSize: 13 }}
        type="financial"
      />
    </View>
  );
}

function AccountCard({ account, updated, getBalanceQuery, onSelect }) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: theme.tableBackground,
        boxShadow: `0 1px 1px ${theme.mobileAccountShadow}`,
        borderRadius: 6,
        marginTop: 10,
        marginRight: 10,
        width: '100%',
      }}
      data-testid="account"
    >
      <Button
        onMouseDown={() => onSelect(account.id)}
        style={{
          flexDirection: 'row',
          border: '1px solid ' + theme.pillBorder,
          flex: 1,
          alignItems: 'center',
          borderRadius: 6,
          '&:active': {
            opacity: 0.1,
          },
        }}
      >
        <View
          style={{
            flex: 1,
            margin: '10px 0',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TextOneLine
              style={{
                ...styles.text,
                fontSize: 17,
                fontWeight: 600,
                color: updated ? theme.mobileAccountText : theme.pillText,
                paddingRight: 30,
              }}
              data-testid="account-name"
            >
              {account.name}
            </TextOneLine>
            {account.bankId && (
              <View
                style={{
                  backgroundColor: theme.noticeBackgroundDark,
                  marginLeft: '-23px',
                  width: 8,
                  height: 8,
                  borderRadius: 8,
                }}
              />
            )}
          </View>
        </View>
        <CellValue
          binding={getBalanceQuery(account)}
          type="financial"
          style={{ fontSize: 16, color: 'inherit' }}
          getStyle={value => value < 0 && { color: 'inherit' }}
          data-testid="account-balance"
        />
      </Button>
    </View>
  );
}

function EmptyMessage() {
  return (
    <View style={{ flex: 1, padding: 30 }}>
      <Text style={styles.text}>
        For Actual to be useful, you need to add an account. You can link an
        account to automatically download transactions, or manage it locally
        yourself.
      </Text>
    </View>
  );
}

function AccountList({
  accounts,
  updatedAccounts,
  getBalanceQuery,
  getOnBudgetBalance,
  getOffBudgetBalance,
  onAddAccount,
  onSelectAccount,
  onSync,
}) {
  const budgetedAccounts = accounts.filter(account => account.offbudget === 0);
  const offbudgetAccounts = accounts.filter(account => account.offbudget === 1);
  const noBackgroundColorStyle = {
    backgroundColor: 'transparent',
    color: 'white',
  };

  return (
    <Page
      title="Accounts"
      headerRightContent={
        <Button
          type="bare"
          style={{
            color: theme.mobileHeaderText,
            margin: 10,
          }}
          activeStyle={noBackgroundColorStyle}
          hoveredStyle={noBackgroundColorStyle}
          onClick={onAddAccount}
        >
          <SvgAdd width={20} height={20} />
        </Button>
      }
      padding={0}
      style={{
        flex: 1,
        backgroundColor: theme.mobilePageBackground,
        paddingBottom: MOBILE_NAV_HEIGHT,
      }}
    >
      {accounts.length === 0 && <EmptyMessage />}
      <PullToRefresh onRefresh={onSync}>
        <View style={{ margin: 10 }}>
          {budgetedAccounts.length > 0 && (
            <AccountHeader name="For Budget" amount={getOnBudgetBalance()} />
          )}
          {budgetedAccounts.map(acct => (
            <AccountCard
              account={acct}
              key={acct.id}
              updated={updatedAccounts.includes(acct.id)}
              getBalanceQuery={getBalanceQuery}
              onSelect={onSelectAccount}
            />
          ))}

          {offbudgetAccounts.length > 0 && (
            <AccountHeader
              name="Off budget"
              amount={getOffBudgetBalance()}
              style={{ marginTop: 30 }}
            />
          )}
          {offbudgetAccounts.map(acct => (
            <AccountCard
              account={acct}
              key={acct.id}
              updated={updatedAccounts.includes(acct.id)}
              getBalanceQuery={getBalanceQuery}
              onSelect={onSelectAccount}
            />
          ))}
        </View>
      </PullToRefresh>
    </Page>
  );
}

export function Accounts() {
  const dispatch = useDispatch();
  const accounts = useAccounts();
  const newTransactions = useSelector(state => state.queries.newTransactions);
  const updatedAccounts = useSelector(state => state.queries.updatedAccounts);
  const [_numberFormat] = useLocalPref('numberFormat');
  const numberFormat = _numberFormat || 'comma-dot';
  const [hideFraction = false] = useLocalPref('hideFraction');

  const { list: categories } = useCategories();

  const transactions = useState({});
  const navigate = useNavigate();

  const onSelectAccount = id => {
    navigate(`/accounts/${id}`);
  };

  const onSelectTransaction = transaction => {
    navigate(`/transaction/${transaction}`);
  };

  const onAddAccount = () => {
    dispatch(replaceModal('add-account'));
  };

  const onSync = () => {
    dispatch(syncAndDownload());
  };

  useSetThemeColor(theme.mobileViewTheme);

  return (
    <View style={{ flex: 1 }}>
      <AccountList
        // This key forces the whole table rerender when the number
        // format changes
        key={numberFormat + hideFraction}
        accounts={accounts.filter(account => !account.closed)}
        categories={categories}
        transactions={transactions || []}
        updatedAccounts={updatedAccounts}
        newTransactions={newTransactions}
        getBalanceQuery={queries.accountBalance}
        getOnBudgetBalance={queries.budgetedAccountBalance}
        getOffBudgetBalance={queries.offbudgetAccountBalance}
        onAddAccount={onAddAccount}
        onSelectAccount={onSelectAccount}
        onSelectTransaction={onSelectTransaction}
        onSync={onSync}
      />
    </View>
  );
}
