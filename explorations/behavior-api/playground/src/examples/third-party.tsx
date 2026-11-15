import type { ComponentPropsWithRef } from 'react';
import z from 'zod';
import { configureForm } from '../../../spike/src/form';
import { createParts } from '../../../spike/src/react/create-parts';
import { standardForm } from '../../../spike/src/standard';
import { Inspector } from '../inspector';

const schema = z.object({
  title: z.string().min(1, 'Give the review a title'),
  rating: z.number().min(1, 'Pick a rating'),
  volume: z.number().max(8, 'Keep the volume at 8 or lower'),
});

const review = configureForm(standardForm, {
  schema,
  defaultValues: { title: '', rating: 0, volume: 5 },
  error: { change: schema, submit: schema },
});

const { Root, Field, FieldError, Submit, Reset, useField, useSelector } = createParts(review);

// Stand-ins for a component library. None of them know the form. They take a value and report changes through
// callbacks, as a library control does, and none of them dispatches a DOM `input` event.
function StarRating({
  value,
  onValueChange,
  onBlur,
}: {
  value: number;
  onValueChange: (value: number) => void;
  onBlur: () => void;
}) {
  return (
    <div role='radiogroup' aria-label='Rating' onBlur={onBlur}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type='button'
          role='radio'
          aria-checked={star === value}
          aria-label={`${star} stars`}
          onClick={() => onValueChange(star)}
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

function Slider({ value, max, onValueChange }: { value: number; max: number; onValueChange: (value: number) => void }) {
  return (
    <div className='actions'>
      <input
        type='range'
        min={0}
        max={max}
        value={value}
        aria-label='Volume slider'
        onChange={event => onValueChange(event.currentTarget.valueAsNumber)}
      />
      <output>{value}</output>
    </div>
  );
}

// A styled input that forwards its props to the element inside, as most design systems do.
function TextBox({ label, ...props }: ComponentPropsWithRef<'input'> & { label: string }) {
  return (
    <span className='hint'>
      {label}: <input {...props} />
    </span>
  );
}

// The hook gives the value and the handle's methods, so a control that reports changes through a callback needs
// no DOM event.
function RatingField() {
  const rating = useField('rating');
  return (
    <StarRating value={rating.state.value} onValueChange={value => rating.change(value)} onBlur={() => rating.blur()} />
  );
}

function VolumeField() {
  const volume = useField('volume');
  return <Slider value={volume.state.value} max={10} onValueChange={value => volume.change(value)} />;
}

export function ThirdParty() {
  return (
    <Root className='layout' onSubmit={() => {}}>
      <div className='card'>
        <label>
          {/* A component that forwards its props: `render` hands it the part's props, value and listeners. */}
          <Field name='title' render={props => <TextBox label='Title' {...props} />} />
          <FieldError name='title' />
        </label>
        <fieldset>
          <legend>Rating</legend>
          <RatingField />
          <FieldError name='rating' />
        </fieldset>
        <fieldset>
          <legend>Volume</legend>
          <VolumeField />
          <FieldError name='volume' />
        </fieldset>
        <div className='actions'>
          <Submit>Post review</Submit>
          <Reset>Reset</Reset>
        </div>
      </div>
      <Inspector useSelector={useSelector} />
    </Root>
  );
}
