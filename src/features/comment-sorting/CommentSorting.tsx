
import type { Order, Sort } from '../../entities/comment/model';
import { Icon } from '../../shared/ui/Icon';

type Props = {
  sort: Sort;
  order: Order;
  onChange: (sort: Sort, order: Order) => void;
};

export function CommentSorting({ sort, order, onChange }: Props) {
  const isDescending = order === 'desc';

  let orderText = 'Ascending';
  let orderLabel = 'Sort descending';
  let iconStyle = {};

  if (isDescending) {
    orderText = 'Descending';
    orderLabel = 'Sort ascending';
    iconStyle = { transform: 'rotate(180deg)' };
  }

  function changeSort(event: React.ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value as Sort, order);
  }

  function changeOrder() {
    if (isDescending) {
      onChange(sort, 'asc');
    } else {
      onChange(sort, 'desc');
    }
  }

  return (
    <div className="sort-controls">
      <label htmlFor="sort">Sort by</label>

      <select id="sort" value={sort} onChange={changeSort}>
        <option value="created_at">Date posted</option>
        <option value="user_name">User name</option>
        <option value="email">Email</option>
      </select>

      <button
        type="button"
        className="order-button"
        onClick={changeOrder}
        aria-label={orderLabel}
      >
        <span style={{ display: 'inline-flex', ...iconStyle }}>
          <Icon name="arrow" size={14} />
        </span>

        {orderText}
      </button>
    </div>
  );
}
